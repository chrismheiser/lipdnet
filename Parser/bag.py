from doi_resolver import DOIResolver
import json
import os
import zipfile
import shutil
import bagit
import datetime
import tempfile


def create_bag(path_bag):
    """
    :param path: directory that contains CSV, JSONLD, and Changelog to be bagged.
    :return: none
    """
    bag = bagit.make_bag(path_bag, {'Name': 'LiPD Project', 'Reference': 'www.lipd.net', 'DOI-Resolved': 'True'})
    return bag


def list_zips(path_root):
    """
    :param path_root: traverse current path and find all .lpd zip files.
    :return: list of file names to be worked on
    """
    os.chdir(path_root)
    bag_list = []
    for file in os.listdir():
        if file.endswith('.lpd'):
            bag_list.append(file)
    return bag_list


def open_bag(path):
    bag = bagit.Bag(path)
    return bag


def resolved_flag(bag):
    """ check DOI flag to see if doi resolver has been previously run """
    if 'DOI-Resolved' in bag.info:
        return True
    return False


def cleanup(path_bag, path_data):

    # move up to path_bag
    os.chdir(path_bag)

    # delete files in path_bag
    for file in os.listdir(path_bag):
        if file.endswith('.txt'):
            os.remove(os.path.join(path_bag, file))

    # move path_data files to path_bag
    for file in os.listdir(path_data):
        shutil.move(os.path.join(path_data, file), path_bag)

    # delete data folder
    shutil.rmtree(path_data)

    return


def validate_md5(bag):
    if bag.is_valid():
        print("Valid md5")
        # for path, fixity in bag.entries.items():
        #     print("path:{}\nmd5:{}\n".format(path, fixity["md5"]))
    else:
        print("Invalid md5")
    return


def update_changelog():
    """
    :key: open changelog txt file. write description & timestamp. close file. (create if not found)
    :param: string
    :return: none
    """
    # description = input("Please enter a short description for this update:\n ")
    description = 'Placeholder for description here.'

    # open changelog file for appending. if doesn't exist, creates file.
    with open('changelog.txt', 'a+') as f:
        # write update line
        f.write(str(datetime.datetime.now().strftime("%d %B %Y %I:%M%p")) + '\nDescription: ' + description)
    return


def process_files(name, path_tmp):

    # path_root = os.getcwd()
    path_bag = os.path.join(path_tmp, name)
    path_data = os.path.join(path_bag, 'data')

    # open bag
    validate_md5(open_bag(path_bag))

    # navigate down to jLD file
    # dir change -> path_data
    os.chdir(path_data)

    # open and load data from jLD file
    jld_file = open(os.path.join(path_data, name + '.jsonld'), 'r+')
    jld_data = json.load(jld_file)
    resolved = DOIResolver().run(jld_data, name)

    # execute DOI resolver script, and overwrite contents into jLD file. close file
    json.dump(resolved, jld_file, indent=4)
    jld_file.close()

    # open changelog. timestamp it. prompt user for short description of changes. close and save
    update_changelog()

    # delete old bag files, and move files to root for re-bagging
    # dir change -> path_bag
    cleanup(path_bag, path_data)

    # create a bag for the 3 files
    new_bag = create_bag(path_bag)
    open_bag(path_bag)

    # validate the new bag
    validate_md5(new_bag)
    new_bag.save(manifests=True)

    return


def create_tmp_dir():

    path_tmp = tempfile.mkdtemp()
    # os.makedirs(os.path.join(path, 'tmp'), exist_ok=True)
    return path_tmp


def re_zip(path_tmp, name, name_lpd):
    shutil.make_archive(name_lpd, format='zip', root_dir=path_tmp, base_dir=name)
    return


def unzip(root, lpd_name):
    """
    :param: root - original directory
    :param: lpd_name - name of lpd file to unzip (w/ extension)
    :return: path to tmp folder in system
    """

    # creates tmp directory somewhere deep in OS
    path_tmp = create_tmp_dir()

    # unzip all .lpd contents to the tmp directory
    with zipfile.ZipFile(lpd_name) as f:
        f.extractall(path_tmp)

    return path_tmp


def main():
    # take in user-chosen directory path
    root = '/Users/chrisheiser1/Desktop/lpd_test'

    # find all .lpd files in current directory
    # dir change -> root
    z_list = list_zips(root)

    for z in z_list:
        print('processing: {}'.format(z))

        # file name w/o extension
        name = os.path.splitext(z)[0]

        # unzip file and get tmp directory path
        path_tmp = unzip(root, z)

        # unbag and check resolved flag. don't run if flag exists
        if resolved_flag(open_bag(os.path.join(path_tmp, name))):
            print("DOI previously resolved. Next file...")
            shutil.rmtree(path_tmp)
            # or could call dir_cleanup here instead
        # process files if flag does not exist
        else:
            # dir change -> tmp/bag
            process_files(name, path_tmp)
            # dir change -> root
            os.chdir(root)
            # zip the directory containing the updated files. created in root directory
            re_zip(path_tmp, name, z)
            os.rename(z + '.zip', z)
            # cleanup and remove tmp directory
            shutil.rmtree(path_tmp)

    return

main()

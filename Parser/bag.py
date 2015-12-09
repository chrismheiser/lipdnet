from doi_resolver import DOIResolver
import json
import os
import zipfile
import shutil
import bagit
import datetime
import tempfile

__author__ = 'Chris Heiser'
"""
PURPOSE: Take .lpd file(s) that have been bagged with Bagit, and compressed (zip). Uncompress and unbag,
read in the DOI from the jsonld file, invoke DOI resolver script, retrieve doi.org info with given DOI,
update jsonld file, Bag the files, and compress the Bag. Output a txt log file with names and errors of
problematic files.

CHANGELOG
Version 1.0 / 12.08.2015 / Chris

Input:  Zipped .lpd file containing a Bag
Output: Zipped .lpd file containing a Bag

"""


def create_bag(path_bag):
    """
    Create a Bag out of given files.
    :param path_bag: (str) Directory that contains csv, jsonld, and changelog files.
    :return: (obj) Bag
    """
    bag = bagit.make_bag(path_bag, {'Name': 'LiPD Project', 'Reference': 'www.lipd.net', 'DOI-Resolved': 'True'})
    return bag


def list_zips(path_root):
    """
    Lists .lpd file(s) in given path.
    :param path_root: (str) Traverse current path and find all .lpd zip files
    :return: (list) File name(s) to be worked on
    """
    os.chdir(path_root)
    bag_list = []
    for file in os.listdir():
        if file.endswith('.lpd'):
            bag_list.append(file)
    return bag_list


def open_bag(path):
    """
    Open Bag at the given path
    :param path: (str) Path to Bag
    :return: (obj) Bag
    """
    bag = bagit.Bag(path)
    return bag


def resolved_flag(bag):
    """
    Check DOI flag in bag.info to see if doi_resolver has been previously run
    :param bag: (obj) Bag
    :return: (bool) Flag
    """
    if 'DOI-Resolved' in bag.info:
        return True
    return False


def dev_logger_txt(root_dir, txt_file, name, info):
    """
    Debug Log. Log names and error of problematic files to a txt file
    :param root_dir: (str) Directory containing .lpd file(s)
    :param txt_file: (str) Name of the txt file to be written to
    :param name: (str) Name of the current .lpd file
    :param info: (str) Error description
    :return: None
    """
    org_dir = os.getcwd()
    os.chdir(root_dir)
    with open(txt_file, 'a+') as f:
        try:
            # Write update line
            f.write("File: " + name + "\n" + "Error: " + info + "\n\n")
        except KeyError:
            print("Debug Log Error")
    os.chdir(org_dir)
    return


def cleanup(path_bag, path_data):
    """

    :param path_bag: (str) Path to root of Bag
    :param path_data: (str) Path to Bag /data subdirectory
    :return: None
    """

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
    """
    Check if Bag is valid
    :param bag: (obj) Bag
    :return: None
    """
    if bag.is_valid():
        print("Valid md5")
        # for path, fixity in bag.entries.items():
        #     print("path:{}\nmd5:{}\n".format(path, fixity["md5"]))
    else:
        print("Invalid md5")
    return


def update_changelog():
    """
    Create or update the changelog txt file. Prompt for update description.
    :return: none
    """
    # description = input("Please enter a short description for this update:\n ")
    description = 'Placeholder for description here.'

    # open changelog file for appending. if doesn't exist, creates file.
    with open('changelog.txt', 'a+') as f:
        # write update line
        f.write(str(datetime.datetime.now().strftime("%d %B %Y %I:%M%p")) + '\nDescription: ' + description)
    return


def process_lpd(name, path_tmp):
    """
    Opens up a jsonld file, invokes doi_resolver, closes file, updates changelog, cleans directory, and makes new bag.
    :param name: (str) Name of current .lpd file
    :param path_tmp: (str) Path to tmp directory
    :return: none
    """

    path_root = os.getcwd()
    path_bag = os.path.join(path_tmp, name)
    path_data = os.path.join(path_bag, 'data')

    # Open Bag. Uneccesary step. Use for debugging.
    # validate_md5(open_bag(path_bag))

    # navigate down to jLD file
    # dir change -> path_data
    os.chdir(path_data)
    jld_file = open(os.path.join(path_data, name + '.jsonld'), 'r+')

    try:
        # Open and load data from jLD file
        jld_data = json.load(jld_file)
        resolved = DOIResolver(path_root, name, jld_data).run()
        # Execute DOI resolver script, and overwrite contents into jLD file. close file
        json.dump(resolved, jld_file, indent=4)
    except ValueError:
        dev_logger_txt(path_root, 'quarantine.txt', name, "Invalid Unicode characters. Unable to load file.")

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
    # validate_md5(new_bag)
    new_bag.save(manifests=True)

    return


def create_tmp_dir():
    """
    Creates tmp working directory somewhere in OS.
    :return: (str) Path to tmp directory
    """

    path_tmp = tempfile.mkdtemp()
    # os.makedirs(os.path.join(path, 'tmp'), exist_ok=True)
    return path_tmp


def re_zip(path_tmp, name, name_ext):
    """
    Zips up directory back to the original location
    :param path_tmp: (str) Path to tmp directory
    :param name: (str) Name of current .lpd file
    :param name_ext: (str) Name of current .lpd file with extension
    :return: None
    """
    shutil.make_archive(name_ext, format='zip', root_dir=path_tmp, base_dir=name)
    return


def unzip(name_ext):
    """
    Unzip .lpd file contents to tmp directory. Save path to the tmp directory.
    :param name_ext: (str) Name of lpd file with extension
    :return: (str) Path to tmp directory
    """
    # Creates tmp directory somewhere deep in OS
    path_tmp = create_tmp_dir()

    # Unzip .lpd contents to the tmp directory
    with zipfile.ZipFile(name_ext) as f:
        f.extractall(path_tmp)
    return path_tmp


def main():
    """
    Main function that controls the script. Take in directory containing the .lpd file(s). Loop for each file.
    :return: None
    """
    # Take in user-chosen directory path
    root = '/Users/chrisheiser1/Desktop/lpd_test'

    # Find all .lpd files in current directory
    # dir change -> root
    z_list = list_zips(root)

    for z in z_list:
        print('processing: {}'.format(z))

        # .lpd name w/o extension
        name = os.path.splitext(z)[0]

        # unzip file and get tmp directory path
        path_tmp = unzip(root, z)

        # Unbag and check resolved flag. Don't run if flag exists
        if resolved_flag(open_bag(os.path.join(path_tmp, name))):
            print("DOI previously resolved. Next file...")
            shutil.rmtree(path_tmp)

        # Process file if flag does not exist
        else:
            # dir change -> tmp/bag
            process_lpd(name, path_tmp)
            # dir change -> root
            os.chdir(root)
            # zip the directory containing the updated files. created in root directory
            re_zip(path_tmp, name, z)
            os.rename(z + '.zip', z)
            # cleanup and remove tmp directory
            shutil.rmtree(path_tmp)
    print("Remember: Quarantine.txt contains a list of errors that may have happened during processing.")
    return

main()

from geoChronR.Parser.misc.bag import *
from geoChronR.Parser.misc.directory import *
from geoChronR.Parser.misc.loggers import *
from geoChronR.Parser.misc.zips import *
from geoChronR.Parser.noaa.lpd_noaa import *


__author__ = 'Chris Heiser'

"""
PURPOSE: Convert a .lpd file (specifically the jsonld JSON data) into a NOAA formatted txt file.

CHANGELOG
Version 1.0 / 12.09.2015 / Chris

Input: .lpd file (Zip containing a Bag)
Output: NOAA formatted .txt file

"""


def process_noaa():
    pass


def process_lpd(name, dir_tmp):
    """
    Opens up a jsonld file, invokes doi_resolver, closes file, updates changelog, cleans directory, and makes new bag.
    :param name: (str) Name of current .lpd file
    :param dir_tmp: (str) Path to tmp directory
    :return: none
    """

    dir_root = os.getcwd()
    dir_bag = os.path.join(dir_tmp, name)
    dir_data = os.path.join(dir_bag, 'data')

    # Navigate down to jLD file
    # dir : dir_root -> dir_data
    os.chdir(dir_data)
    jld_file = open(os.path.join(dir_data, name + '.jsonld'), 'r+')

    try:
        # Open and load data from jLD file
        jld_data = json.load(jld_file)
        NOAA(dir_root, name, jld_data).start()
    except ValueError:
        txt_log(dir_root, 'quarantine.txt', name, "Invalid Unicode characters. Unable to load file.")

    jld_file.close()

    # Delete tmp folder and all contents
    shutil.rmtree(dir_tmp)

    return


def start():
    # Take in user-chosen directory path
    dir_root = '/Users/chrisheiser1/Desktop/lpd_test'
    os.chdir(dir_root)

    # Run lpd_noaa or noaa_lpd ?
    ans = input("Which conversion? (type 1 or 2):\n1.LPD to NOAA\n2. NOAA to LPD")

    # .lpd to NOAA
    if ans == 1:

        # Find all needed files in current directory
        f_list = list_files('.lpd')
        for name_ext in f_list:
            print('processing: {}'.format(name_ext))

            # File name w/o extension
            name = os.path.splitext(name_ext)[0]

            # unzip file and get tmp directory path
            dir_tmp = unzip(name_ext)

            # Process file
            process_lpd(name, dir_tmp)

    # NOAA to .lpd
    elif ans == 2:
        f_list = list_files('.txt')

    return



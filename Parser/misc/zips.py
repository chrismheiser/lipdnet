import zipfile
import shutil
import tempfile

__author__ = 'Chris Heiser'

"""
PURPOSE: Functions related to zipping and unzipping .lpd (or other) files. Also responsible for making tmp directory to
use as a temporary workspace while each file is being processed.

CHANGELOG
Version 1.0 / 12.09.2015 / Chris

"""


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

    # Unzip contents to the tmp directory
    with zipfile.ZipFile(name_ext) as f:
        f.extractall(path_tmp)
    return path_tmp

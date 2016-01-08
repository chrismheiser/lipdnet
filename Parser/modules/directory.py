import os
import tempfile

__author__ = 'Chris Heiser'


def create_tmp_dir():
    """
    Creates tmp working directory somewhere in OS.
    :return: (str) Path to tmp directory
    """

    path_tmp = tempfile.mkdtemp()
    # os.makedirs(os.path.join(path, 'tmp'), exist_ok=True)
    return path_tmp


def list_files(x):
    """
    Lists file(s) in given path of the X type.
    :param x: (str) File extension that we are interested in.
    :return: (list of str) File name(s) to be worked on
    """
    file_list = []
    for file in os.listdir():
        if file.endswith(x):
            file_list.append(file)
    return file_list

import os

__author__ = 'Chris Heiser'

"""
PURPOSE:

CHANGELOG
Version 1.0 / 12.09.2015 / Chris

Input:
Output:

"""


def list_files(x):
    """
    Lists file(s) in given path of the X type.
    :param path_root: (str or list) Traverse current path and find all files of X type.
    :param x: (str) File extension that we are interested in.
    :return: (list of str) File name(s) to be worked on
    """
    file_list = []
    for file in os.listdir():
        if file.endswith(x):
            file_list.append(file)
    return file_list

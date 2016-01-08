import os
import datetime

__author__ = 'Chris Heiser'


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


def txt_log(dir_root, txt_file, name, info):
    """
    Debug Log. Log names and error of problematic files to a txt file
    :param dir_root: (str) Directory containing .lpd file(s)
    :param txt_file: (str) Name of the txt file to be written to
    :param name: (str) Name of the current .lpd file
    :param info: (str) Error description
    :return: None
    """
    org_dir = os.getcwd()
    os.chdir(dir_root)
    with open(txt_file, 'a+') as f:
        try:
            # Write update line
            f.write("File: " + name + "\n" + "Error: " + info + "\n\n")
        except KeyError:
            print("Debug Log Error")
    os.chdir(org_dir)
    return

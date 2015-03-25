__author__ = 'chrisheiser1'

import json
from collections import OrderedDict
import flatten
import re


"""
TO DO LIST

    DONE - import jsonld file
    DONE - flatten the jsonld data

    - Convert keys back to underscore naming
    - Insert values into matching key values
    - Output new NOAA text file

"""

"""
Special cases for renaming:
Elevation : Value, Units
Core_Length: Value, Units

"""


def name_to_underscore(key):

    if key == 'DOI' or key == 'NOTE':
        string_out = key

    elif key == 'PublishedDateorYear':
        string_out = 'Published_Date_or_Year'

    elif key == 'OriginalSourceURL':
        string_out = 'Original_Source_URL'

    else:
        extension = False
        if '-' in key:
            extension = True
            ext_split = key.split('-')
            num_ext = ext_split[1]
        string_split = re.findall('[A-Z][a-z]*', key)
        string_out = string_split[0]
        for word in range(1, len(string_split)):
            string_out = string_out + '_' + string_split[word]
        if extension:
            string_out = string_out + '-' + num_ext

    return string_out


def split_path(string):
    string = string.split(':')
    if 'OriginalSourceURL' in string:
        string[1] = string[1] + ':' + string[2]

    if ('-' in string[0]) and ('Funding' not in string[0]) and ('Grant' not in string[0]):
        last = string[1]
        string = string[0].split('-')
        string.append(last)

    return string


def path_context(flat_file):

    new_dict = {}

    # Lists to recompile Values and Units
    lat = []
    lon = []
    elev = []
    core = []

    # Print out each item in the list for debugging
    for item in flat_file:
        split_list = split_path(item)

        # if ('Max' in split_list) or ('Min' in split_list) or ('Unit' in split_list) or ('Value' in split_list):
        #     key, val = path_context(split_list)
        #     new_dict[key] = val
        #
        # else:
        #     new_dict[split_list[0]] = split_list[1]
    return new_dict


def parse(file, template):

    # Units that depend on the full string path
    ignore = ['Max', 'Min', 'Value', 'Unit']

    # Items that are split into 2 parts: Value and Units
    split = ['CoreLength', 'Elevation']


    # Open the file
    json_data = open(file)

    # Load in the json data from the file
    data = json.load(json_data)
    # for k, v in data.items():
    #     k = name_to_underscore(k)
    #     new_dict[k] = v

    # Flatten the json dictionary
    flat = flatten.run(data)

    # Create a new dictionary with keys matching NOAA template
    dict_out = path_context(flat)

    # with open(template, 'r') as f:
    #     for line in iter(f):

    # Return the flattened list
    return flat


def main(file):

    template = 'noaa-template.txt'

    # Cut the extension from the file name
    file = 'noaa-out.jsonld'
    split = file.split('-')
    name = split[0]

    # Run the file through the parser
    output = parse(file, template)

    # Txt file output
    new_file_name_jsonld = str(name) + '-out.txt'
    file_txt = open(new_file_name_jsonld, 'w')

    # Write each item in the list into our output text file
    for item in output:
        file_txt.write("%s\n" % item)
    file_txt = open(new_file_name_jsonld, 'r+')

    return

main('noaa-out.jsonld')
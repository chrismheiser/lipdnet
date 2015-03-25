__author__ = 'chrisheiser1'

import json
from collections import OrderedDict
import flatten
import re
import os
import sys

"""
TO DO LIST

    DONE - import jsonld file
    DONE - flatten the jsonld data
    DONE - Output new NOAA text file
    DONE- Convert keys back to underscore naming

    WIP - Insert values into matching key values

PROBLEMS
    - Figure out why Long max and Long min are not being output to the text file
    - Figure out why CoreLength and Elevation are not being output to text file
    - Need to fix some formatting problems in output file
    - Add in the data columns at the bottom of the file

"""


# Convert CamelCase naming back to Underscore naming
def name_to_underscore(key):

    if key == 'DOI' or key == 'NOTE':
        string_out = key

    elif key == 'PublishedDateorYear':
        string_out = 'Published_Date_or_Year'

    elif key == ('OriginalSourceURL' or 'Original_Source_URL'):
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


# Used in the path_context function. Split the full path into a list of steps
def split_path(string):
    out = []
    position = string.find(':')
    # If value is -1, that means the item was not found in the string.
    if position != -1:
        key = string[:position]
        val = string[position+1:]
        out.append(key)
        out.append(val)

    if ('-' in key) and ('Funding' not in key) and ('Grant' not in key):
        out = key.split('-')
        out.append(val)

    return out


def path_context(flat_file):

    new_dict = {}

    # Lists to recompile Values and Units
    elev = []
    core = []

    # Print out each item in the list for debugging
    for item in flat_file:
        split_list = split_path(item)
        lst_len = len(split_list)
        value = split_list[lst_len-1]
        print(split_list)

        if 'Latitude' and 'Max' in split_list:
            new_dict['Northernmost_Latitude'] = value

        elif 'Latitude' and 'Min' in split_list:
            new_dict['Southernmost_Latitude'] = value

        elif 'Longitude' and 'Max' in split_list:
            new_dict['Easternmost_Longitude'] = value

        elif 'Longitude' and 'Min' in split_list:
            new_dict['Westernmost_Longitude'] = value

        elif 'Elevation' in split_list:
            elev.append(value)

        elif 'CoreLength' in split_list:
            core.append(value)

        else:
            if len(split_list) > 2:
                key = lst_len - 2
                new_dict[split_list[key]] = value

            else:
                new_dict[split_list[0]] = split_list[1]

    new_dict['Core_Length'] = ''.join(core)
    new_dict['Elevation'] = ''.join(elev)
    return new_dict


def parse(file, template):

    # Naming setup
    name_split = file.split('.')
    out_name = name_split[0] + '-l2n.txt'

    # Create a new output text file
    file_o = open(out_name, 'w')
    # file_exist = os.getcwd() + '/' + out_name
    # if not os.path.exists(file_exist):
    #     open(out_name, 'w')
    # else:
    #     print('Txt file already exists with that name')
    #     sys.exit(0)

    # Open the JSON file
    json_data = open(file)

    # Load in the json data from the file
    data = json.load(json_data)

    # Flatten the json dictionary
    flat = flatten.run(data)

    # Create a new dictionary with keys matching NOAA template
    dict_out = path_context(flat)
    for k, v in dict_out.items():
        new = name_to_underscore(k)
        dict_out[new] = dict_out.pop(k)

    with open(template, 'r') as f:
        for line in iter(f):
            for k, v in dict_out.items():
                if k in line:
                    position = line.find(':')
                    line = line[:position+1] + ' ' + v + '\n'

            file_o.write(line)

    file_o.close()
    return


def main(file):

    template = 'noaa-blank.txt'

    # Cut the extension from the file name
    file = 'noaa-n2l.jsonld'

    # Run the file through the parser
    parse(file, template)

    return

main('noaa-n2l.jsonld')
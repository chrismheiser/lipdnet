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


def name_to_underscore(key):
    return re.findall('[A-Z][a-z]*', key)


def parse(file, template):

    # Open the file
    json_data = open(file)
    # Load in the json data from the file
    data = json.load(json_data)
    for k, v in data.items():
        print('old: ' + k)
        k = name_to_underscore(k)
        print('new: ' + k)

    # Flatten the json dictionary
    flat = flatten.run(data)
    # Print out each item in the list for debugging
    # for item in flat:
    #     print(item)


    with open(template, 'r') as f:
        for line in iter(f):


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

main()
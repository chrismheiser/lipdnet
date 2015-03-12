__author__ = 'chrisheiser1'

import json
from collections import OrderedDict
import flatten


def parse(file):

    boundary = '#-----------------------------------------------------------------------'

    json_data = open(file)
    data = json.load(json_data)
    flat = flatten.run(data)
    # for item in flat:
    #     print(item)
    return flat


def main():

    # Cut the extension from the file name
    file = 'noaa-out.jsonld'
    split = file.split('-')
    name = split[0]

    # Run the file through the parser
    output = parse(file)

    # LPD file output
    new_file_name_jsonld = str(name) + '-out.txt'
    file_txt = open(new_file_name_jsonld, 'w')
    for item in output:
        file_txt.write("%s\n" % item)
    file_txt = open(new_file_name_jsonld, 'r+')


    return

main()
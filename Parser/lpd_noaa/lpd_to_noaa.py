__author__ = 'chrisheiser1'

from collections import OrderedDict
import json
import os
import csv
import re
import copy

from flattener import flatten


"""
    Revision 0
    DONE - import jsonld file
    DONE - flatten the jsonld data
    DONE - Output new NOAA text file
    DONE- Convert keys back to underscore naming
    DONE - Figure out why Long max and Long min are not being output to the text file
    DONE - Figure out why CoreLength and Elevation are not being output to text file
    DONE - Need to fix some formatting problems in output file
    DONE - Insert values into matching key values
    DONE - Problem replacing 'Data' in certain lines. Using k = "Data" and v =Variables list, one per line, shortname-..."
    DONE - Add in the data columns at the bottom of the file

    REVISION 1
    - check for csv data. (either see if chron and data sections are not null in lipd file, or check directory files)
    -

"""

# Global Lists
section1 = ['onlineResource', 'studyName', 'archive', 'parameterKeywords', 'originalSourceURL']
section2 = ['date']
section3 = ['studyName']
section4 = ['investigators']
section5 = ['description']
section6 = ['pub']
section7 = ['funding']
section8 = ['geo']
section9 = ['earliestYear', 'mostRecentYear', 'timeUnit', 'coreLength', 'notes']
section10 = ['speciesName', 'commonName', 'treeSpeciesCode']
section11 = ['chronology']
section12 = ['paleoData']


# Check for Chronology and Data CSVs
def csv_found(filename, datatype):
    found = False

    # Attempt to open Data CSV
    try:
        if open(filename + '-' + datatype + '.csv'):
            found = True
            print("{0} - found {1} csv".format(filename, datatype))
    except FileNotFoundError:
        print("{0} - no {1} csv".format(filename, datatype))

    return found


# Convert camelCase to underscore
def underscore(key):

    if key == 'coreLength':
        print(key)
        
    if key == 'doi':
        string_out = 'DOI'

    elif key == ('originalSourceURL'):
        string_out = 'Original_Source_URL'

    else:
        string_split = re.findall('[A-Z][a-z]*', key)
        try:
            string_out = string_split[0]
        except IndexError:
            string_out = key

        for word in range(1, len(string_split)):
            string_out = string_out + '_' + string_split[word]

    print(string_out)
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


# Get the key and value items from a line by looking for and lines that have a ":"
def clean_keys(line):
    hash = line.find('#')
    position = line.find(":")
    if (hash == 0) and (hash != -1):
        # If value is -1, that means the item was not found in the string.
        if position != -1:
            key = line[1:position].lstrip().rstrip()
            return key
    return line


# Turns the flattened json list back in to a usable dictionary structure
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

        if 'Latitude' in split_list:
            if 'Max' in split_list:
                new_dict['Northernmost_Latitude'] = value

            elif 'Min' in split_list:
                new_dict['Southernmost_Latitude'] = value

        elif 'Longitude' in split_list:
            if 'Max' in split_list:
                new_dict['Easternmost_Longitude'] = value

            elif 'Min' in split_list:
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

    if core:
        new_dict['Core_Length'] = concat_units(core)
    if elev:
        new_dict['Elevation'] = concat_units(elev)

    return new_dict


def create_blanks(dict_in, section):
    for key in section:
        try:
            dict_in[key]
        except KeyError:
            dict_in[key] = ''
    return dict_in


def write_top(file_out, dict_in):

    dict_in = create_blanks(dict_in, section1)
    file_out.write('# ' + dict_in['studyName'] + '\n\
#-----------------------------------------------------------------------\n\
#                World Data Service for Paleoclimatology, Boulder\n\
#                                  and\n\
#                     NOAA Paleoclimatology Program\n\
#             National Centers for Environmental Information (NCEI)\n\
#-----------------------------------------------------------------------\n\
# Template Version 2.0\n\
# NOTE: Please cite Publication, and Online_Resource and date accessed when using these data.\n\
# If there is no publication information, please cite Investigators, Title, and Online_Resource\n\
and date accessed.\n\
# Online_Resource: https://www.ncdc.noaa.gov/paleo/study/999??? (assigned by WDC Paleo)\n\
# Online_Resource: http://www1.ncdc.noaa.gov/pub/data/paleo/ (assigned by WDC Paleo)\n\
#\n\
# Original_Source_URL: ' + dict_in['originalSourceURL'] + '\n\
#\n\
# Description/Documentation lines begin with #\n\
# Data lines have no #\n\
#\n\
# Archive: ' + dict_in['archive'] + '\n\
n\
# Parameter_Keywords: ' + dict_in['parameterKeywords'] + '\n\
#--------------------\n')

    return


def write_block(file_out, dict_in, header, section):
    dict_in = create_blanks(dict_in, section)
    file_out.write('# ' + header + ' \n')
    for k, v in dict_in.items():
        file_out.write('#       ' + underscore(k) + ': ' + str(v) + ' \n')
    file_out.write('#------------------ \n')
    return


def write_pub(file_out, dict_in):
    return


def write_geo(file_out, dict_in):
    return


def write_chron(file_out, dict_in):
    return


def write_paleoData(file_out, dict_in):
    return


def write_funding(file_out, dict_in):
    return


def write_file(file_in, steps_dict):

    file_out = open('output/' + file_in + '.txt', "w")

    write_top(file_out, steps_dict[1])
    write_block(file_out, steps_dict[2], 'Contribution_Date', section2)
    write_block(file_out, steps_dict[3], 'Title', section3)
    write_block(file_out, steps_dict[4], 'Investigators', section4)
    write_block(file_out, steps_dict[5], 'Description_Notes_and_Keywords', section5)
    write_pub(file_out, steps_dict[6])
    write_funding(file_out, steps_dict[7])
    write_geo(file_out, steps_dict[8])
    write_block(file_out, steps_dict[9], 'Data_Collection', section9)
    write_block(file_out, steps_dict[10], 'Species', section10)
    write_chron(file_out, steps_dict[11])
    write_paleoData(file_out, steps_dict[12])

    # Close the file and end
    file_out.close()

    return


def restructure(dict_in, key, value):

    # If the key isn't in any list, stash it in number 13 for now
    number = 13

    if key in section1:
        # StudyName only triggers once, append to section 3 also
        if key == 'studyName':
            dict_in[3][key] = value
        number = 1
    elif key in section2:
        number = 2
    elif key in section4:
        number = 4
    elif key in section5:
        number = 5
    elif key in section6:
        number = 6
    elif key in section7:
        number = 7
    elif key in section8:
        number = 8
    elif key in section9:
        number = 9
    elif key in section10:
        number = 10
    elif key in section11:
        number = 11
    elif key in section12:
        number = 12
    dict_in[number][key] = value

    return dict_in


# Main Parser
def parse(file_in):

    steps_dict = {1:{},2:{},3:{},4:{},5:{},6:{},7:{},8:{},9:{},10:{},11:{},12:{},13:{}}

    # Open the JSON file
    json_data = open(file_in + '.lipd')

    # Load in the json data from the file
    data = json.load(json_data)

    # Restructure all fields by sections into a new dictionary
    for k, v in data.items():
        steps_dict = restructure(steps_dict, k, v)

    # for k, v in steps_dict.items():
    #     print(k, v)

    write_file(file_in, steps_dict)

    return


# Load in the template file, and run through the parser
def main():

    # Initializations
    file_list = []

    # Directories for testing purposes
    os.chdir('/Users/chrisheiser1/Desktop/')
    # os.chdir('/Users/chrisheiser1/Dropbox/GeoChronR/noaa_lpd_files/output/')

    # List of files to process in chosen directory
    for file in os.listdir():
        if file.endswith('.lipd'):
            file_list.append(os.path.splitext(file)[0])

    # Creates the directory 'output' if it does not exist
    if not os.path.exists('output/'):
        os.makedirs('output/')

    # Loop parser once for every file
    for file in file_list:
        print(file)

        # Run file through parser
        parse(file)


main()
__author__ = 'chrisheiser1'

from collections import OrderedDict
import json
import os
import csv
import re
import copy
import sys

from flattener import flatten


"""
    Revision 0
    DONE - import jsonld file
    DONE - flatten the jsonld data
    DONE - Output new NOAA text file
    DONE - Convert keys back to underscore naming
    DONE - Figure out why Long max and Long min are not being output to the text file
    DONE - Figure out why CoreLength and Elevation are not being output to text file
    DONE - Need to fix some formatting problems in output file
    DONE - Insert values into matching key values
    DONE - Problem replacing 'Data' in certain lines. Using k = "Data" and v =Variables list, one per line, shortname-..."
    DONE - Add in the data columns at the bottom of the file

    REVISION 1
    DONE - Check for csv data. (either see if chron and data sections are not null in lipd file, or check directory files)
    DONE - Write output file without the use of a template file
    DONE - Write based on section, and keep functions small
    - Fix discrepancy with Published_Date vs. Published_Date_Or_year. Same thing?
    - Find out how to make better spacing in the chronology and data sections (have a fixed space of 5 characters?)

"""

# Pre-compiled Regexes
first_cap_re = re.compile('(.)([A-Z][a-z]+)')
all_cap_re = re.compile('([a-z0-9])([A-Z])')

# GLOBAL
# 13 is a list of keys to ignore when using create_blanks
sections = {1: ['onlineResource', 'studyName', 'archive', 'parameterKeywords', 'originalSourceUrl'],
            2: ['date'],
            3: ['studyName'],
            4: ['investigators'],
            5: ['description'],
            6: ['pub'],
            7: ['funding', 'agency', 'grant'],
            8: ['geo'],
            9: ['collectionName', 'earliestYear', 'mostRecentYear', 'timeUnit', 'coreLength', 'notes'],
            10: ['speciesName', 'commonName', 'treeSpeciesCode'],
            11: ['chronology'],
            12: ['paleoData'],
            13: ['funding', 'type', 'bbox', 'geo']}

# The order of the items in the list is the order that we want to write them to the file.
# 11 is the order for writing each column in the variables section
ordering = {1: ['studyName', 'onlineResource', 'originalSourceUrl', 'archive', 'parameterKeywords'],
            2: ['date'],
            3: ['studyName'],
            4: ['investigators'],
            5: ['description'],
            6: ['authors', 'publishedDateOrYear', 'publishedTitle', 'journalName', 'volume', 'edition', 'issue',
                'pages', 'doi', 'onlineResource', 'fullCitation', 'abstract'],
            7: ['agency', 'grant'],
            8: ['siteName', 'location', 'country', 'northernmostLatitude', 'southernmostLatitude',
                'easternmostLongitude', 'westernmostLongitude', 'elevation'],
            9: ['collectionName', 'earliestYear', 'mostRecentYear', 'timeUnit', 'coreLength', 'notes'],
            10: ['speciesName', 'commonName'],
            11: ['parameter', 'description', 'material', 'error', 'units', 'seasonality', 'archive', 'detail',
                 'method', 'dataType']}

# Check for Chronology and Data CSVs
def csv_found(filename, datatype):
    found = False

    # Attempt to open Data CSV
    try:
        if open(filename + '-' + datatype + '.csv'):
            found = True
            # print("{0} - found {1} csv".format(filename, datatype))
    except FileNotFoundError:
        # print("{0} - no {1} csv".format(filename, datatype))
        pass

    return found


# Convert camelCase to underscore
def underscore(key):

    # Special keys that need a specific key change
    if key == 'doi':
        s2 = 'DOI'

    elif key == 'agency':
        s2 = 'Funding_Agency_Name'

    elif key == 'originalSourceURL':
        s2 = 'Original_Source_URL'

    # Use regex to split and add underscore at each capital letter
    else:
        s1 = first_cap_re.sub(r'\1_\2', key)
        s2 = all_cap_re.sub(r'\1_\2', key).title()

    return s2


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


def create_coreLength(dict_in):
    try:
        val = dict_in['coreLength']['value']
    except KeyError:
        val = ''
    try:
        unit = dict_in['coreLength']['unit']
    except KeyError:
        unit = ''
    return val, unit


def create_blanks(dict_in, section):
    for key in ordering[section]:
        try:
            dict_in[key]
        except KeyError:
            # Ignore keys in section 13
            if key not in sections[13]:
                dict_in[key] = ''
    return dict_in


def write_top(file_out, dict_in):
    dict_in = create_blanks(dict_in, 1)
    file_out.write('# ' + dict_in['studyName'] + '\n\
#-----------------------------------------------------------------------\n\
#                World Data Service for Paleoclimatology, Boulder\n\
#                                  and\n\
#                     NOAA Paleoclimatology Program\n\
#             National Centers for Environmental Information (NCEI)\n\
#-----------------------------------------------------------------------\n\
# Template Version 2.0\n\
# NOTE: Please cite Publication, and Online_Resource and date accessed when using these data.\n\
# If there is no publication information, please cite Investigators, Title, and Online_Resource\
and date accessed.\n\
# Online_Resource: ' +  dict_in['onlineResource'] + '\n\
#\n\
# Original_Source_URL: ' + dict_in['originalSourceUrl'] + '\n\
#\n\
# Description/Documentation lines begin with #\n\
# Data lines have no #\n\
#\n\
# Archive: ' + dict_in['archive'] + '\n\
#\n\
# Parameter_Keywords: ' + dict_in['parameterKeywords'] + '\n\
#--------------------\n')

    return


def write_generic(file_out, dict_in, header, section):
    dict_in = create_blanks(dict_in, section)
    file_out.write('# ' + header + ' \n')
    for entry in ordering[section]:
        if entry == 'coreLength':
            val, unit = create_coreLength(dict_in)
            file_out.write('#   ' + underscore(entry) + ': ' + str(val) + ' ' + str(unit) + '\n')
        else:
            file_out.write('#   ' + underscore(entry) + ': ' + str(dict_in[entry]) + '\n')
    file_out.write('#------------------\n')
    return


def write_pub(file_out, dict_in):
    for key, pub_list in dict_in.items():
        for pub in pub_list:
            write_generic(file_out, pub, 'Publication', 6)
    return


def write_funding(file_out, dict_in):
    for key, fund_list in dict_in.items():
        for fund in fund_list:
            write_generic(file_out, fund, 'Funding_Agency', 7)
    return


def write_geo(file_out, dict_in):
    for k, v in dict_in.items():
        dict_in = reorganize_geo(v)
    write_generic(file_out, dict_in, 'Site_Information', 8)
    return


def write_chron(file_in, file_out, dict_in):
    file_out.write('# Chronology:\n#\n')

    if csv_found(file_in, 'chronology'):
        cols = dict_in['chronology']['columns']
        # Write variables line from dict_in
        for index, col in enumerate(cols):
            if index == 0:
                file_out.write('#       ' + col['parameter'] + ' (' + col['units'] + ')  | ')
            elif index == len(cols)-1:
                file_out.write(col['parameter'] + ' (' + col['units'] + ')\n')
            else:
                file_out.write(col['parameter'] + ' (' + col['units'] + ')  | ')
        # Iter over CSV and write line for line
        with open(file_in + '-chronology.csv', 'r') as f:
            for line in iter(f):
                line = line.split(',')
                for index, value in enumerate(line):
                    if index == 0:
                        file_out.write('#          ' + str(value) + '              ')

                    elif index == len(line) - 1:
                        file_out.write(str(value))
                    else:
                        file_out.write(str(value) + '                 ')

    file_out.write('#------------------\n')

    return


def write_variables(file_out, dict_in):
    cols = dict_in['paleoData'][0]['columns']
    file_out.write('# Variables\n\
#\n\
# Data variables follow that are preceded by "##" in columns one and two.\n\
# Data line variables format:  Variables list, one per line, shortname-tab-longname-tab-longname components\
 ( 9 components: what, material, error, units, seasonality, archive, detail, method, C or N for Character or\
  Numeric data)\n#\n')
    for col in cols:
        for entry in ordering[11]:
            # Need TAB after a parameter
            if entry == 'parameter':
                file_out.write('##' + col[entry] + '    ')
            # No space after last entry
            elif entry == 'dataType':
                file_out.write(col[entry])
            # Space and comma after normal entries
            else:
                file_out.write(col[entry] + ', ')
        file_out.write('\n')
    file_out.write('#\n#------------------\n')

    return


def write_paleoData(file_in, file_out, dict_in):
    # Find out why noaa_to_lpd is not getting missing value
    file_out.write('# Data: \n\
# Data lines follow (have no #) \n\
# Data line format - tab-delimited text, variable short name as header) \n\
# Missing_Values: ' + dict_in['paleoData'][0]['missingValue'] + '\n#\n')

    if csv_found(file_in, 'data'):
        # Write variables line from dict_in
        cols = dict_in['paleoData'][0]['columns']
        for col in cols:
            for entry in ordering[11]:
                if entry == 'parameter':
                    file_out.write(col[entry] + '       ')
        file_out.write('\n')
        # Iter over CSV and write line for line
        with open(file_in + '-data.csv', 'r') as f:
            for line in iter(f):
                line = line.split(',')
                for index, value in enumerate(line):
                    if index == len(line) - 1:
                        file_out.write(str(value))
                    else:
                        file_out.write(str(value) + '   ')

    return


def write_file(file_in, steps_dict):

    file_out = open('output/' + file_in + '.txt', "w")

    write_top(file_out, steps_dict[1])
    write_generic(file_out, steps_dict[2], 'Contribution_Date', 2)
    write_generic(file_out, steps_dict[3], 'Title', 3)
    write_generic(file_out, steps_dict[4], 'Investigators', 4)
    write_generic(file_out, steps_dict[5], 'Description_Notes_and_Keywords', 5)
    write_pub(file_out, steps_dict[6])
    write_funding(file_out, steps_dict[7])
    write_geo(file_out, steps_dict[8])
    write_generic(file_out, steps_dict[9], 'Data_Collection', 9)
    write_generic(file_out, steps_dict[10], 'Species', 10)
    write_chron(file_in, file_out, steps_dict[11])
    write_variables(file_out, steps_dict[12])
    write_paleoData(file_in, file_out, steps_dict[12])

    # Close the text file
    file_out.close()
    return


def coordinates(list_in, dict_temp):

    length = len(list_in)
    locations = ['northernmostLatitude', 'easternmostLongitude', 'southernmostLatitude', 'westernmostLongitude']

    if length == 0:
        for location in locations:
            dict_temp[location] = ' '
    elif length == 2:
        dict_temp[locations[0]] = list_in[0]
        dict_temp[locations[1]] = list_in[1]
        dict_temp[locations[2]] = list_in[0]
        dict_temp[locations[3]] = list_in[1]

    elif length == 4:
        for index, location in enumerate(locations):
            dict_temp[locations[index]] = list_in[index]

    return dict_temp


def reorganize_geo(dict_in):

    # The new dict that will be returned
    dict_temp = {}

    # Properties
    for k, v in dict_in['properties'].items():
        if k == 'elevation':
            dict_temp['elevation'] = str(v['value']) + ' ' + str(v['unit'])
        else:
            dict_temp[k] = v

    # Geometry
    dict_temp = coordinates(dict_in['geometry']['coordinates'], dict_temp)

    return dict_temp


def reorganize(dict_in, key, value):

    # If the key isn't in any list, stash it in number 13 for now
    number = 13

    if key in sections[1]:
        # StudyName only triggers once, append to section 3 also
        if key == 'studyName':
            dict_in[3][key] = value
        number = 1
    elif key in sections[2]:
        number = 2
    elif key in sections[4]:
        number = 4
    elif key in sections[5]:
        number = 5
    elif key in sections[6]:
        number = 6
    elif key in sections[7]:
        number = 7
    elif key in sections[8]:
        number = 8
    elif key in sections[9]:
        number = 9
    elif key in sections[10]:
        number = 10
    elif key in sections[11]:
        number = 11
    elif key in sections[12]:
        number = 12
    dict_in[number][key] = value

    return dict_in


# Main Parser
def parse(file_in):

    # Initializations
    steps_dict = {1:{},2:{},3:{},4:{},5:{},6:{},7:{},8:{},9:{},10:{},11:{},12:{},13:{}}

    # Open the LiPD file
    json_data = open(file_in + '.lipd')

    # Load in the LiPD data
    data = json.load(json_data)

    # Reorganize data by corresponding section according to NOAA template file
    for k, v in data.items():
        steps_dict = reorganize(steps_dict, k, v)

    # Send newly reorganized data to be written to the txt file
    write_file(file_in, steps_dict)

    return


# Load in the template file, and run through the parser
def main():

    # Initializations
    file_list = []

    # Directories for testing purposes
    os.chdir('/Users/chrisheiser1/Desktop/')
    # os.chdir('/Users/chrisheiser1/Dropbox/GeoChronR/noaa_lpd_files/')

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

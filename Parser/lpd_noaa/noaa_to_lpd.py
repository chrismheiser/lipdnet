__author__ = 'chrisheiser1'

from collections import OrderedDict
import json
import os
import csv


"""
Be able to convert NOAA format to LPD format
Be able to convert LPD format to NOAA format

Things to do:
    DONE - Strip the # and the white space on the left and right of strings
    DONE - Try to capture all the info with ":", because that's data we want
    DONE - Figure out how to capture the data cols and maybe put it in a list(?)
    DONE - do you need to lowercase all the strings?
    DONE - Piece together all the dictionaries into the final dictionaries
    DONE - Determine which info from the NOAA text file that we want to keep (waiting on Nick)
    DONE - get rid of K-V's that are in the dictionary blocks. It's adding duplicates at the root level.
    DONE - Get rid of blank values. Stop them from adding to the dictionary
    DONE - Figure out what to do with coreLength val and unit
    DONE - Decide what to do with Chron data columns
    DONE - Capture variables section and use it later to cross-check the data section
    DONE - Output Data columns to CSV
    DONE - Strip '\n' from lines, and rstrip() also
    DONE - Data columns are overwriting each other
    DONE - Convert all names to JSONLD naming (method to convert to camel casing)
    DONE - Fix case where Variables section doesn't have double ## marks
    DONE - update to have same measurements columns as old format
    DONE - update to have consistent naming as old format
    DONE - add meastablename and filename (csv) fields
    DONE - change the formatting for the funding block. new structure
    WIP - description and notes section needs special parsing
    WIP - yamalia - fix values that span multiple lines (i.e. abstract, description and notes)
    - need special parsing for any links (don't want to split in form 'http' + '//www.something.com')

    IGNORE KEYS: earliestYear, mostRecentYear, dataLine variables

    # How to properly loop with enumerate
    for index, val in enumerate(values):
        values[index] = val.lstrip()

"""


# Receive split list from separate_data_vars, and turn it into a dictionary for that column
# Accept list, return dictionary
def create_var_col(list_in, col_count):
    # Format: what, material, error, units, seasonality, archive, detail, method,
    # C or N for Character or Numeric data, direction of relation to climate (positive or negative)
    dict_out = OrderedDict()
    dict_out['column'] = col_count
    for index, item in enumerate(list_in):
        if item != '':
            if index == 0:
                dict_out['shortName'] = item
            elif index == 1:
                dict_out['longName'] = item
            elif index == 2:
                dict_out['material'] = item
            elif index == 3:
                dict_out['error'] = item
            elif index == 4:
                dict_out['units'] = item
            elif index == 5:
                dict_out['seasonality'] = item
            elif index == 6:
                dict_out['archive'] = item
            elif index == 7:
                dict_out['detail'] = item
            elif index == 8:
                dict_out['method'] = item
            elif index == 9:
                dict_out['dataType'] = item
            elif index == 10:
                dict_out['direction'] = item
    return dict_out


# For the variables section, clean up the line and return a list of each of the 10 items
# Accepts string, returns list
def separate_data_vars(line):
    if '#' in line:
        line = line.replace("#", "")
        line = line.lstrip()
    a = line.split('\t')
    b = a[1].split(',')
    a.pop()
    c = a + b
    for index, string in enumerate(c):
        c[index] = string.lstrip().rstrip()
    return c


# All path items are automatically strings. If you think it's an int or float, this attempts to convert it.
# Accept string, return float
def convert_num(number):
    try:
        return float(number)
    except ValueError:
        return number


# Convert underscore naming into camel case naming
# Accept string, return string
def name_to_camelCase(strings):
    # strings = strings.lower()
    split_word = strings.split('_')
    # for i in range(0, len(split_word)):
    #     if i != 0:
    #         split_word[i] = split_word[i].title()
    strings = ''.join(split_word)
    return strings


# Convert formal titles to camelcase json_ld text that matches our context file
# Accept string, return string
def name_to_jsonld(title):

    if title == '':
         out = ''

    # Northernmost_Latitude -> lat:max
    # Southernmost_Latitude -> lat:min
    # Easternmost_Longitude -> lon:max
    # Westernmost_Longitude -> lon:min
    # Elevation -> elevation:value
    # Elevation -> elevation:units
    # Authors -> pub:authors
    # Date -> pub:date
    # DOI -> pub:DOI
    # Collection_Name -> collectionName
    # NOTES -> comments
    # Site_Name -> siteName
    # Missing Values -> missingValue
    #
    else:
        return

    return out


# Special split for [elevation, core, etc] that have value and units on one line.
# Accept string, return integer and string
def split_name_unit(line):
    if line != '':
        try:
            # Sometimes the units are wrapped in parenthesis
            if '(' in line:
                line = line.split('(')
                line[1] = line[1].replace(')', '')
            # If no parenthesis
            else:
                line = line.split()
            value = line[0]
            unit = line[1]
        # Catch error when trying to split a line that has no space between value and unit (i.e. '150cm')
        except IndexError:
            value = line[0]
            unit = 'refer to value'
        return value, unit


# Remove the unnecessary characters in the line that we don't want
# Accept string, return string
def str_cleanup(line):
    line = line.rstrip()
    if '#' in line:
        line = line.replace("#", "")
        line = line.lstrip()
    if '-----------' in line:
        line = ''

    return line


# Get the key and value items from a line by looking for and lines that have a ":"
# Accepts string, return two strings
def slice_key_val(line):
    position = line.find(":")
    # If value is -1, that means the item was not found in the string.
    if position != -1:
        key = line[:position]
        value = line[position+1:]
        value = value.lstrip()
        return key, value
    else:
        key = line
        value = None
        return key, value


# Main parser.
# Accept the text file. We'll open it, read it, and return a compiled dictionary to write to a json file
# May write a chronology CSV, and a data CSV, depending on what data is available
def parse(file, path, filename):

    # Strings
    last_insert = None

    # Counters
    grant_id = 0
    funding_id = 0
    data_col_ct = 1
    line_num = 0

    # Boolean markers
    chronology_on = False
    chron_vars_start = True
    missing_val_on = False
    data_vals_on = False
    variables_on = False

    # Lists
    data_var_names = []
    chron_col_list = []
    data_col_list = []
    data_tables = []
    funding = []
    missing_val_alts = ['missing value', 'missing values', 'missingvalue', 'missingvalues', 'missing_values']

    # All dictionaries needed to create JSON structure
    temp_funding = OrderedDict()
    vars_dict = OrderedDict()
    geo = OrderedDict()
    lat = OrderedDict()
    lon = OrderedDict()
    elev = OrderedDict()
    pub = OrderedDict()
    coreLen = OrderedDict()
    chron_dict = OrderedDict()
    data_dict_upper = OrderedDict()
    data_dict_lower = OrderedDict()
    final_dict = OrderedDict()

    # List of items that we don't want to output
    ignore_keys = ['EarliestYear', 'MostRecentYear']
    ignore_var_lines = ['(have no #)',
                        'line variables format',
                        'c or n for character or numeric',
                        'preceded by "##"'
                        ]
    ignore_data_lines = ['(have no #)',
                         'tab-delimited text',
                         'age ensembles archived']
    ignore_blanks = ['\n', '', '#\n']

    # List of keys that need their values converted to ints/floats
    numbers = ['Volume', 'Value', 'Min', 'Max', 'Pages', 'Edition', 'CoreLength']

    # List of items that need to be split (value, units)
    split = ['CoreLength', 'Elevation']

    # Lists for what keys go in specific dictionary blocks
    geo_keys = {'lat_n': ['northernmostlatitude', 'northernmost latitude'],
                'lat_s': ['southernmostlatitude', 'southernmost latitude'],
                'lon_e': ['easternmostlongitude', 'easternmost longitude'],
                'lon_w': ['westernmostlongitude', 'westernmost longitude'],
                'places': ['Location', 'Country'],
                'elev': ['Elevation']
    }

    funding_lst = ['FundingAgencyName', 'Grant']
    pub_lst = ['OnlineResource', 'OriginalSourceUrl', 'Investigators', 'Authors', 'PublishedDateOrYear',
               'PublishedTitle', 'JournalName', 'Volume', 'Doi', 'FullCitation', 'Abstract', 'Pages', 'Edition']

    # Open the text file in read mode. We'll read one line at a time until EOF
    with open(file, 'r') as f:

        for line in iter(f):
            line_num += 1

            # Chronology Section
            if chronology_on:

                # When reaching the end of the chron section, set the marker to off and close the CSV file
                if '-------' in line:
                    chronology_on = False

                    # If there is nothing between the chronology start and the end barrier, then there won't be a CSV
                    if chron_start_line != line_num-1:
                        chron_csv.close()

                # Special case for first line in chron section. Grab variables and open a new CSV file
                elif chron_vars_start:
                    chron_vars_start = False

                    # Open CSV for writing
                    chron_filename = filename + '-chronology.csv'
                    csv_path = path + '/' + chron_filename
                    chron_csv = open(csv_path, 'w', newline='')
                    cw = csv.writer(chron_csv)

                    # Split the line into a list of variables
                    chron_col_ct = 1
                    line = line.lstrip()
                    variables = line.split('|')
                    for index, var in enumerate(variables):
                        temp_dict = OrderedDict()
                        temp_dict['column'] = chron_col_ct
                        name, unit = split_name_unit(var.replace('\n', '').lstrip().rstrip())
                        temp_dict['shortName'] = name
                        temp_dict['units'] = unit
                        chron_col_list.append(temp_dict)
                        chron_col_ct += 1
                    chron_dict['filename'] = chron_filename
                    chron_dict['chronTableName'] = 'Chronology'
                    chron_dict['columns'] = chron_col_list

                # Split the line of data values, then write to CSV file
                else:
                    values = line.split()
                    cw.writerow(values)

            # Variables Section
            # Variables are the only lines that have a double # in front
            elif variables_on:

                process_line = True

                # If you hit the end of the section, turn the marker off
                if "------" in line:
                    variables_on = False
                    process_line = False

                for item in ignore_var_lines:
                    if item in line:
                        process_line = False
                for item in ignore_blanks:
                    if item == line:
                        process_line = False

                # If the line isn't in the ignore list, then it's a variable line
                if process_line:

                    # Split the line items, and cleanup
                    cleaned_line = separate_data_vars(line)

                    # Add the items into a column dictionary
                    data_col_dict = create_var_col(cleaned_line, data_col_ct)

                    # Keep a list of all variable names
                    data_var_names.append(data_col_dict['shortName'])

                    # Add the column dictionary into a final dictionary
                    data_col_list.append(data_col_dict)
                    data_col_ct += 1

            # Data Section
            elif missing_val_on:

                process_line = True

                for item in ignore_data_lines:
                    if item in line:
                        process_line = False
                for item in ignore_blanks:
                    if item == line:
                        process_line = False

                if process_line:
                    # Split the line at each space (There's one space between each data item)
                    values = line.split()

                    # Write all data values to CSV
                    if data_vals_on:
                        dw.writerow(values)

                    # Check for the line of variables
                    else:

                        var = str_cleanup(values[0].lstrip())
                        # Check if a variable name is in the current line
                        if var == data_var_names[0]:
                            data_vals_on = True

                            # Open CSV for writing
                            data_filename = filename + '-data.csv'
                            csv_path = path + '/' + data_filename
                            data_csv = open(csv_path, 'w', newline='')
                            dw = csv.writer(data_csv)

            # Metadata section
            else:
                # Line Continuation: Sometimes there are items that span a few lines.
                # If this happens, we want to combine them all properly into one entry.
                if '#' not in line and line != '' and last_insert is not None:
                    old_val = last_insert[key]
                    last_insert[key] = old_val + line

                # No Line Continuation: This is the start or a new entry
                else:
                    line = str_cleanup(line)

                    # Grab the key and value from the current line
                    try:
                        # Split the line into key, value pieces
                        key, value = slice_key_val(line)

                        if value is None:
                            # Use chronology line as a marker to show if we have hit the Chronology section
                            if key.lower() == 'chronology':
                                chronology_on = True
                                chron_start_line = line_num
                            elif key.lower() == 'variables':
                                variables_on = True

                        else:
                            # Use missing value line as a marker to show if we have hit the Data section
                            if key.lower() in missing_val_alts:
                                missing_val_on = True
                                final_dict[key] = value

                            # Convert naming to camel case
                            key = name_to_camelCase(key)
                            l_key = key.lower()

                            # Ignore any entries that are specified in the skip list, or any that have empty values
                            if key not in ignore_keys:

                                # Insert into the final dictionary
                                if l_key in geo_keys['lat_n'] or l_key in geo_keys['lat_s']:
                                    if l_key in geo_keys['lat_n']:
                                        last_insert = lat
                                        lat['max'] = convert_num(value)
                                    elif l_key in geo_keys['lat_s']:
                                        lat['min'] = convert_num(value)
                                elif l_key in geo_keys['lon_e'] or l_key in geo_keys['lon_w']:
                                    last_insert = lon
                                    if l_key in geo_keys['lon_e']:
                                        lon['max'] = convert_num(value)
                                    elif l_key in geo_keys['lon_w']:
                                        lon['min'] = convert_num(value)
                                elif key in geo_keys['elev']:
                                    # Split the elev string into value and units
                                    val, unit = split_name_unit(value)
                                    elev['value'] = convert_num(val)
                                    elev['unit'] = unit
                                    last_insert = elev
                                elif key in geo_keys['places']:
                                    geo[key] = value
                                    last_insert = geo
                                elif key in pub_lst:
                                    last_insert = pub
                                    if key in numbers:
                                        pub[key] = convert_num(value)
                                    else:
                                        pub[key] = value
                                elif key == 'CoreLength':
                                    val, unit = split_name_unit(value)
                                    coreLen['value'] = val
                                    coreLen['unit'] = unit
                                    last_insert = coreLen

                                elif key in funding_lst:
                                    if key == 'FundingAgencyName':
                                        funding_id += 1
                                        key = 'name'
                                    elif key == 'Grant':
                                        grant_id += 1
                                        key = 'grant'
                                    temp_funding[key] = value

                                    # If both counters are matching, we are ready to add content to the funding list
                                    if grant_id == funding_id:
                                        funding.append(temp_funding.copy())
                                        temp_funding.clear()

                                else:
                                    final_dict[key] = value
                                    last_insert = final_dict

                    # Ignore any errors from NoneTypes that are returned from slice_key_val
                    except TypeError:
                        pass

    # Wait to close the data CSV until we reached the end of the text file
    try:
        data_csv.close()
    except NameError:
        print("Couldn't Close Data CSV")

    # Piece together measurements block
    data_dict_upper['filename'] = data_filename
    data_dict_upper['measTableName'] = 'Data'
    data_dict_upper['columns'] = data_col_list
    data_tables.append(data_dict_upper)

    # Piece together geo block
    geo['latitude'] = lat
    geo['longitude'] = lon
    geo['elevation'] = elev

    # Piece together final dictionary
    final_dict['funding'] = funding
    final_dict['geo'] = geo
    final_dict['coreLength'] = coreLen
    final_dict['pub'] = pub
    final_dict['chronology'] = chron_dict
    final_dict['measurements'] = data_tables

     # Insert the data dictionaries into the final dictionary
    for k, v in vars_dict.items():
        data_dict_lower[k] = v

    return final_dict


# Main function takes in file name, and outputs new jsonld file
def main():

    # Store a list of all the txt files in the specified directory. This is what we'll process.
    file_list = []
    os.chdir('/Users/chrisheiser1/Desktop/')
    # os.chdir('/Users/chrisheiser1/Dropbox/GeoChronR/noaa_lipd_files/chron')
    for file in os.listdir():
        if file.endswith('.txt'):
            file_list.append(file)

    for txts in file_list:

        # Print which file we're currently processing
        print(txts)

        # Cut the extension from the file name
        name = os.path.splitext(txts)[0]

        # Creates the directory 'output' if it does not already exist
        path = 'output/' + name
        if not os.path.exists(path):
              os.makedirs(path)

        # Run the file through the parser
        dict_out = parse(txts, path, name)

        # LPD file output
        out_name = name + '.jsonld'
        file_jsonld = open(path + '/' + out_name, 'w')
        file_jsonld = open(path + '/' + out_name, 'r+')
        # file_jsonld = open('output/' + out_name, 'w')
        # file_jsonld = open('output/' + out_name, 'r+')

        # Write finalDict to json-ld file with dump
        # Dump outputs into a human-readable json hierarchy
        json.dump(dict_out, file_jsonld, indent=4)

    return


main()
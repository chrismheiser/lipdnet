__author__ = 'chrisheiser1'

from collections import OrderedDict
import json
import os
import csv
import re
import copy

from flattener import flatten


"""
TO DO LIST

    REVISION 0
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


# Units and value are not always appended in the correct order.
# Use this to make sure that they are concatenated incorrectly
def concat_units(list_in):
    if list_in[0] == 'm':
        string_out = list_in[1] + ' ' + list_in[0]
    else:
        string_out = list_in[0] + ' ' + list_in[1]

    return string_out


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
        try:
            string_out = string_split[0]
        except IndexError:
            string_out = key
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


# Accepts: string, Returns: int
def clean_fund_grant(key):
    if '-' in key:
        position = key.find('-')
        extension = key[position+1:]
        return int(extension)
    return


# Writes a Funding Agency block for each Funding and Grant item in the dictionaries
def write_funding_block(file_in, dict_fund, dict_grant):
    for i in range(1, len(dict_fund) + 1):
        file_in.write('# Funding_Agency \n')
        file_in.write('#       Funding_Agency_Name: ' + str(dict_fund[i]) + ' \n')
        file_in.write('#       Grant: ' + str(dict_grant[i]) + ' \n')
        file_in.write('#------------------ \n')

    return file_in


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


# Split the input dictionary into two parts: The column data, and the var data.
def get_col_dict(dict_in):
    dict_col = OrderedDict()
    dict_var = OrderedDict()

    for k, v in dict_in.items():
        if k == 'Columns':
            dict_col[k] = v
        else:
            dict_var[k] = v

    return dict_col, dict_var


# The main parser
def parse(file_in, c_csv, d_csv, template):


    # Open the JSON file
    json_data = open(file_in)

    # Load in the json data from the file
    data = json.load(json_data)

    # Don't want to flatten the column data, so split the data into two different dictionaries
    col_data, var_data = get_col_dict(data)

    # Flatten the json dictionary
    flat = flatten.run(var_data)

    # Create a new dictionary with keys matching NOAA template
    funding = {}
    grant = {}
    dict_temp = path_context(flat)
    dict_out = {}

    for k, v in dict_temp.items():

        # Convert LPD naming back to NOAA naming
        new = name_to_underscore(k)

        # # Special case for the Funding Agency block. Tricky because there can be multiple blocks
        # if 'Funding_Agency_Name' in new:
        #     extension = clean_fund_grant(new)
        #     funding[extension] = v
        #
        # elif 'Grant' in new:
        #     extension = clean_fund_grant(new)
        #     grant[extension] = v

        # Any other entry needs the key replaced with the converted key. Value stays the same.
        else:
            dict_out[new] = v

    # Open the NOAA template file, and read line by line
    with open(template, 'r') as f:
        line_num = 0
        skip = False
        for line in iter(f):

            # We skip lines 46-48 because they have FundingAgency lines that we don't want
            if (line_num < 46) or (line_num > 48):

                # Clean the key of all symbols and spaces
                clean_key = clean_keys(line)

                # When you reach the funding block, write all funding and grant entries at the same time
                if clean_key == '# Funding_Agency \n':
                    write_funding_block(file_out, funding, grant)
                    skip = True

                else:
                    # Loop through the dictionary to see where the key matches in the template
                    for k, v in dict_out.items():
                        if k == clean_key:
                            position = line.find(':')
                            line = line[:position+1] + ' ' + v + '\n'

                # After we have made all the changes to the line, write it back to the file
                if not skip:
                    file_out.write(line)
                skip = False

            line_num += 1

    # Write column data back to the file
    # Need to write col data for each item in the value list.
    file_out.write(line)
    var_count = 0
    var_titles = []
    data_list = []

    # Collect the number of variables, and the variable names from the col dictionary
    for k, v in col_data.items():
        for i, j in v.items():
            var_count += 1
            var_titles.append(i)

    # Combine the variable names to make a title row. Write it to the file
    var_titles.append('\n')
    line = ' '.join(var_titles)
    file_out.write(line)

    # Nested loop to add one data item from each variable to the row at a time.
    for k, v in col_data.items():
        item = 0
        max_length = 0

        # Find the max
        for i, j in v.items():
            if len(j) > max_length:
                max_length = len(j)

        # Loop the amount of times of the biggest list
        while item < max_length:
            line = ''
            for i, j in v.items():
                # If data lists are not the same size, we don't want to go out of bounds.
                try:
                    data_list.append(str(j[item]))
                except IndexError:
                    data_list.append(j['  '])

            # Increase counter, write line to file, and clear line
            item += 1
            data_list.append('\n')
            line = ' '.join(data_list)
            file_out.write(line)
            data_list.clear()

    # Close the file and end
    file_out.close()
    return


# Load in the template file, and run through the parser
def main():

    template = 'noaa-template.txt'
    file_list = []

    os.chdir('/Users/chrisheiser1/Desktop/')
    # os.chdir('/Users/chrisheiser1/Dropbox/GeoChronR/noaa_lpd_files/output/')

    for file in os.listdir():
        if file.endswith('.jsonld'):
            file_list.append(os.path.splitext(file)[0])

    print(file_list)

    for file in file_list:
        d_csv = False
        c_csv = False

        # Attempt to open Data CSV
        try:
            with open(file + '-data.csv', 'r') as f:
                d_csv = True
        except FileNotFoundError:
            print("Data CSV not found")

        # Attempt to open Chronology CSV
        try:
            with open(file + '-chronology.csv', 'r') as f:
                c_csv = True
        except FileNotFoundError:
            print("Chron CSV not found")

        # Run the file through the parser
        parse(file, c_csv, d_csv, template)

        # Creates the directory 'output' if it does not already exist
        if not os.path.exists('output/'):
            os.makedirs('output/')

    return


main()
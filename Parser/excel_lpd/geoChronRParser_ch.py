"""
Add-on Packages
"""
# from tkinter import filedialog
# import tkinter
import xlrd

"""
LOCAL
"""
from flattener import flatten
from doi_resolver import DOIResolver

"""
STLIB
"""
from collections import OrderedDict
import csv
import json
import os
import copy

"""
Determine if multiple chronologies will be combined into one sheet, or separated with one sheet per location
Reformat based on new context file. Match item names and output structure
"""

# Use this to output data columns to a csv file
# Accepts: Workbook(Obj), Sheet(str), name(str) / Returns: None
def output_csv_datasheet(workbook, sheet, name):
    temp_sheet = workbook.sheet_by_name(sheet)
    csv_folder_and_name = str(name) + '/' + str(name) + '-' + str(sheet) + '.csv'
    csv_full_path = 'output/' + csv_folder_and_name
    file_csv = open(csv_full_path, 'w', newline='')
    w = csv.writer(file_csv)

    try:
        # Loop to find starting variable name
        # Try to find if there are variable headers or not
        ref_first_var = traverse_short_row_str(temp_sheet)

        # Traverse down to the "Missing Value" cell to get us near the data we want.
        missing_val_row = traverse_missing_value(temp_sheet)

        # Get the missing val for search-and-replace later
        missing_val = get_missing_val(temp_sheet)

        # Loop for 5 times past "Missing Value" to see if we get a match on the variable header
        # Don't want to loop for too long, or we're wasting our time.
        position_start = var_headers_check(temp_sheet, missing_val_row, ref_first_var)
        data_cell_start = traverse_headers_to_data(temp_sheet, position_start)

        # Loop over all variable names, and count how many there are. We need to loop this many times.
        first_short_cell = traverse_short_row_int(temp_sheet)
        var_limit = count_vars(temp_sheet, first_short_cell)

        # Until we reach the bottom worksheet
        current_row = data_cell_start
        while current_row < temp_sheet.nrows:
            data_list = []

            # Move down a row and go back to column 0
            current_column = 0

            # Until we reach the right side worksheet
            while current_column < var_limit:
                # Increment to column 0, and grab the cell content
                cell_value = replace_missing_vals(temp_sheet.cell_value(current_row, current_column), missing_val)
                data_list.append(cell_value)
                current_column += 1
            data_list = replace_missing_vals(data_list, missing_val)
            w.writerow(data_list)
            current_row += 1

    except IndexError:
        pass

    file_csv.close()
    return


# Output the data columns from chronology sheet to csv file
# Accepts: Workbook(obj), sheet(str), name(str) / Returns: None
def output_csv_chronology(workbook, sheet, name):
    temp_sheet = workbook.sheet_by_name(sheet)
    csv_folder_and_name = str(name) + '/' + str(name) + '-' + str(sheet) + '.csv'
    csv_full_path = 'output/' + csv_folder_and_name
    file_csv = open(csv_full_path, 'w', newline='')
    w = csv.writer(file_csv)

    try:
        total_vars = count_chron_variables(temp_sheet)
        row = traverse_to_chron_data(temp_sheet)

        while row < temp_sheet.nrows:
            data_list = get_chron_data(temp_sheet, row, total_vars)
            w.writerow(data_list)
            row += 1

    except IndexError:
        pass

    file_csv.close()
    return



"""
GEO DATA
"""

"""
# GeoJSON Polygon. (One matching pair, and two or more unique pairs)
def geometry_polygon(lat, lon):
    polygon_dict = OrderedDict()

    return polygon_dict
"""

# GeoJSON Linestring. (Two or more unique pairs)
def geometry_linestring(lat, lon):

    linestring_dict = OrderedDict()
    coordinates = []
    temp = [None, None]

    # Point type, Matching pairs.
    if lat[0] == lat[1] and lon[0] == lon[1]:
        lat.pop()
        lon.pop()
        linestring_dict = geometry_point(lat, lon)

    else:
        # Creates coordinates list
        for i in lat:
            temp[0] = i
            for j in lon:
                temp[1] = j
                coordinates.append(copy.copy(temp))

        # Create geometry block
        linestring_dict['type'] = 'Linestring'
        linestring_dict['coordinates'] = coordinates

    return linestring_dict

"""
GeoJSON Point. (One unique pair)
"""
def geometry_point(lat, lon):

    coordinates = []
    point_dict = OrderedDict()
    for index, point in enumerate(lat):
        coordinates.append(lat[index])
        coordinates.append(lon[index])
    point_dict['type'] = 'Point'
    point_dict['coordinates'] = coordinates
    return point_dict


"""
Take in lists of lat and lon coordinates, and determine what geometry to create
"""
def compile_geometry(lat, lon):

    # Sort lat an lon in numerical order
    lat.sort()
    lon.sort()
    if len(lat) == 2 and len(lon) == 2:
        geo_dict = geometry_linestring(lat, lon)

        """
        # 4 coordinate values
        if (lat[0] != lat[1]) and (lon[0] != lon[1]):
            geo_dict = geometry_polygon(lat, lon)
        # 3 unique coordinates
        else:
            geo_dict = geometry_multipoint(lat, lon)
        """

    # 2 coordinate values
    elif len(lat) == 1 and len(lon) == 1:
        geo_dict = geometry_point(lat, lon)

    # Too many points, or no points
    else:
        geo_dict = {}
        print("Compile Geometry Error")

    return geo_dict

"""
Compile top-level GEO dictionary.
"""
def compile_geo(dict_in):
    dict_out = OrderedDict()
    dict_out['type'] = 'Feature'
    geometry = compile_geometry([dict_in['latMin'], dict_in['latMax']], [dict_in['lonMin'], dict_in['lonMax']])
    dict_out['geometry'] = geometry
    dict_out['properties'] = {'siteName': dict_in['siteName'], 'elevation': {'value': dict_in['elevation'], 'unit': 'm'}}

    return dict_out

"""
MISC HELPER METHODS
"""

def compile_temp(dict_in, key, value):
    if single_item(value):
        dict_in[key] = value[0]
    else:
        dict_in[key] = value

    return dict_in


def compile_fund(d_in):
    list_out = []
    for counter, item in enumerate(d_in['agency']):
        list_out.append({'fundingAgency': d_in['agency'][counter], 'fundingGrant': d_in['grant'][counter]})
    return list_out


"""
Compile the pub section of the metadata sheet
"""
def compile_pub(dict_in):
    dict_out = OrderedDict()
    dict_out['author'] = dict_in['pubAuthor']
    dict_out['title'] = dict_in['pubTitle']
    dict_out['journal'] = dict_in['pubJournal']
    dict_out['pubYear'] = dict_in['pubYear']
    dict_out['volume'] = dict_in['pubVolume']
    dict_out['issue'] = dict_in['pubIssue']
    dict_out['pages'] = dict_in['pubPages']
    dict_out['doi'] = dict_in['pubDOI']
    dict_out['abstract'] = dict_in['pubAbstract']
    return dict_out

"""
Check an array to see if it is a single item or not
Accepts: List / Returns: Boolean
"""
def single_item(array):
    if len(array) == 1:
        return True
    return False


# Do cell_check to see if there is any content to retrieve
# Returns Boolean (true: content, false: empty)
def cell_occupied(temp_sheet, row, col):
    try:
        if temp_sheet.cell_value(row, col) != ("N/A" and " " and xlrd.empty_cell and ""):
            return True
        return False
    except IndexError:
        pass


# Convert formal titles to camelcase json_ld text that matches our context file
# Keep a growing list of all titles that are being used in the json_ld context
# Accepts: String / Returns: String
def name_to_jsonld(title_in):

    title_in = title_in.lower()

    # Float check for debugging. If float gets here, usually means variables are mismatched on the data sheet
    if type(title_in) is float:
        print("name_to_jsonld type error: {0}".format(title_in))

    # Sheet names
    if title_in == 'metadata':
        title_out = 'metadata'
    elif title_in == 'mhronology':
        title_out = 'chronology'
    elif title_in == 'data (qc)' or title_in == 'data(qc)':
        title_out = 'dataQC'
    elif title_in == 'data (original)' or title_in == 'data(original)':
        title_out = 'dataOriginal'
    elif title_in == 'data':
        title_out = 'data'
    elif title_in == 'proxyList':
        title_out = 'proxyList'
    elif title_in == 'about':
        title_out = 'about'

    # Metadata variables
    elif 'study title' in title_in:
        title_out = 'studyTitle'
    elif 'investigators' in title_in:
        title_out = 'investigators'

    # Pub
    elif 'authors' in title_in:
        title_out = 'pubAuthor'
    elif 'publication title' == title_in:
        title_out = 'pubTitle'
    elif title_in == 'journal':
        title_out = 'pubJournal'
    elif title_in == 'year':
        title_out = 'pubYear'
    elif title_in == 'volume':
        title_out = 'pubVolume'
    elif title_in == 'issue':
        title_out = 'pubIssue'
    elif title_in == 'pages':
        title_out = 'pubPages'
    elif title_in == 'report number':
        title_out = 'pubReportNumber'
    elif title_in == 'doi':
        title_out = 'pubDOI'
    elif title_in == 'abstract':
        title_out = 'pubAbstract'
    elif 'alternate citation' in title_in:
        title_out = 'pubAlternateCitation'

    # Geo
    elif title_in == 'site name':
        title_out = 'siteName'
    elif 'northernmost latitude' in title_in:
        title_out = 'latMax'
    elif 'southernmost latitude' in title_in:
        title_out = 'latMin'
    elif 'easternmost longitude' in title_in:
        title_out = 'lonMax'
    elif 'westernmost longitude' in title_in:
        title_out = 'lonMin'
    elif 'elevation (m)' in title_in:
        title_out = 'elevation'
    elif 'collection_name' in title_in:
        title_out = 'collectionName'

    # Funding
    elif title_in == "funding_agency_name":
        title_out = 'agency'
    elif title_in == "grant":
        title_out = 'grant'

    # Measurement Variables
    elif title_in == 'short_name':
        title_out = 'parameter'
    elif title_in == 'what':
        title_out = 'description'
    elif title_in == 'material':
        title_out = 'material'
    elif title_in == 'error':
        title_out = 'error'

    elif title_in == 'units':
        title_out = 'units'
    elif title_in == 'seasonality':
        title_out = 'seasonality'
    elif title_in == 'archive':
        title_out = 'archive'
    elif title_in == 'detail':
        title_out = 'detail'
    elif title_in == 'method':
        title_out = 'method'
    elif title_in == 'data_type':
        title_out = 'dataType'
    elif title_in == 'basis of climate relation':
        title_out = 'basis'

    elif title_in == 'climate_interpretation_code' or title_in == 'climate_intepretation_code':
        title_out = 'climateInterpretation'

    elif title_in == 'notes' or title_in == 'comments':
        title_out = 'notes'

    else:
        return

    return title_out


# Find out what type of values are stored in a specific column in data sheet
# Accepts: sheet(obj), colListNum(int) / Returns: string
def get_data_type(temp_sheet, colListNum):
    short = traverse_short_row_str(temp_sheet)
    mv_cell = traverse_missing_value(temp_sheet)
    row = var_headers_check(temp_sheet, mv_cell, short)
    temp = temp_sheet.cell_value(row, colListNum - 1)

    # Make sure we are not getting the dataType of a "NaN" item
    while (temp == 'NaN') and (row < temp_sheet.nrows):
        row += 1

    # If we find a value before reaching the end of the column, determine the dataType
    if row < temp_sheet.nrows:
        # Determine what type the item is
        str_type = instance_str(temp_sheet.cell_value(row, colListNum - 1))

    # If the whole column is NaN's, then there is no dataType
    else:
        str_type = 'None'

    return str_type


# Tells you what data type you have, and outputs it in string form
# Accepts: data / Returns: string
def instance_str(cell):
    if isinstance(cell, str):
        return 'str'
    elif isinstance(cell, int):
        return 'int'
    elif isinstance(cell, float):
        return 'float'
    else:
        return 'unknown'

        # Look for any missing values in the data_list. If you find any, replace with 'NaN'


# Accepts: data_list(list), missing_val(str) / Returns: data_list(list)
def replace_missing_vals(cell_entry, missing_val):
    missing_val_list = ['none', 'na', '', '-', 'n/a', 'N/A', 'N/a']
    if missing_val not in missing_val_list:
        missing_val_list.append(missing_val)
    if isinstance(cell_entry, str):
        cell_entry = cell_entry.lower()
    if cell_entry in missing_val_list:
        cell_entry = 'NaN'
    return cell_entry


# Extract units from parenthesis in a string. i.e. "elevation (meters)"
# Accepts: string / Returns: string
def extract_units(string_in):
    start = '('
    stop = ')'
    return string_in[string_in.index(start) + 1:string_in.index(stop)]


# Extract the short name from a string that also has units.
# Accepts: string / Returns: string
def extract_short(string_in):
    stop = '('
    return string_in[:string_in.index(stop)]


"""
DATA WORKSHEET HELPER METHODS
"""


# Starts at the first short name, and counts how many variables are present
# Accepts: temp_sheet(obj), first_short(int) / Returns: vars(int)
def count_vars(temp_sheet, first_short):
    vars = 0

    # If we hit a blank cell, or the MV / Data cells, then stop
    while cell_occupied(temp_sheet, first_short, 0) and temp_sheet.cell_value(first_short, 0) != ("Missing" and "Data"):
        vars += 1
        first_short += 1
    return vars


# Look for what missing value is being used.
# Accepts: None / Returns: Missing value (str)
def get_missing_val(temp_sheet):
    row = traverse_missing_value(temp_sheet)
    # There are two blank cells to check for a missing value
    empty = ''
    missing_val = temp_sheet.cell_value(row, 1)
    missing_val2 = temp_sheet.cell_value(row, 2)
    if cell_occupied(temp_sheet, row, 1):
        if isinstance(missing_val, str):
            missing_val = missing_val.lower()
        return missing_val
    elif cell_occupied(temp_sheet, row, 2):
        if isinstance(missing_val2, str):
            missing_val2 = missing_val2.lower()
        return missing_val2
    return empty


# Traverse to short name cell in data sheet. Get the row number.
# Accepts: temp_sheet(obj) / Returns: current_row(int)
def traverse_short_row_int(temp_sheet):
    for i in range(0, temp_sheet.nrows):
        # We need to keep the first variable name as a reference.
        # Then loop down past "Missing Value" to see if there is a matching variable header
        # If there's not match, then there must not be a variable header row.
        if 'Short' in temp_sheet.cell_value(i, 0):
            current_row = i + 1
            return current_row
    return


# Traverse to short name cell in data sheet
# Accepts: temp_sheet(obj) / Returns: first_var(str)
def traverse_short_row_str(temp_sheet):
    for i in range(0, temp_sheet.nrows):

        # We need to keep the first variable name as a reference.
        # Then loop down past "Missing Value" to see if there is a matching variable header
        # If there's not match, then there must not be a variable header row.
        if 'Short' in temp_sheet.cell_value(i, 0):
            current_row = i + 1
            ref_first_var = temp_sheet.cell_value(current_row, 0)
            return ref_first_var
    return


# Traverse to missing value cell in data sheet
# Accepts: temp_sheet(obj) / Returns: row (int)
def traverse_missing_value(temp_sheet):
    # Traverse down to the "Missing Value" cell. This gets us near the data we want.
    for i in range(0, temp_sheet.nrows):

        # Loop down until you hit the "Missing Value" cell, and then move down one more row
        if 'Missing' in temp_sheet.cell_value(i, 0):
            missing_row_num = i
            return missing_row_num
    return


# Traverse to the first cell that has data
# If the cell on Col 0 has content, check 5 cells to the right for content also, as a fail-safe
# Accepts: temp_sheet(obj), var_headers_start(int) / Returns: data_cell_start(int)
def traverse_headers_to_data(temp_sheet, start_cell):
    # Start at the var_headers row, and try to find the start of the data cells
    # Loop for 5 times. It's unlikely that there are more than 5 blank rows between the var_header row and
    # the start of the data cells. Usually it's 1 or 2 at most.
    while not cell_occupied(temp_sheet, start_cell, 0):
        start_cell += 1
    return start_cell


# Traverse from the missing value cell to the first occupied cell
# Accepts: temp_sheet(obj), start (int) / Returns: start(int)
def traverse_mv_to_headers(temp_sheet, start):
    # Start at the var_headers row, and try to find the start of the data cells
    # Loop for 5 times. It's unlikely that there are more than 5 blank rows between the var_header row and
    # the start of the data cells. Usually it's 1 or 2 at most.
    start += 1
    # Move past the empty cells
    while not cell_occupied(temp_sheet, start, 0):
        start += 1
    # Check if there is content in first two cols
    # Move down a row, check again. (Safety check)
    num = 0
    for i in range(0, 2):
        if cell_occupied(temp_sheet, start, i):
            num += 1
    start += 1
    for i in range(0, 2):
        if cell_occupied(temp_sheet, start, i):
            num += 1
    return start


# Check for matching variables first. If match, return var_header cell int.
# If no match, check the first two rows to see if one is all strings, or if there's some discrepancy
# Accepts: temp_sheet(obj), var_headers_start(int), ref_first_var(str) / Returns: start_cell(int)
def var_headers_check(temp_sheet, missing_val_row, ref_first_var):
    start = traverse_mv_to_headers(temp_sheet, missing_val_row)
    # If we find a match, then Variable headers exist for this file
    if temp_sheet.cell_value(start, 0) == ref_first_var:
        return start + 1
    # No var match, start to manually check the first two rows and make a best guess
    else:
        col = 0
        str_row1 = 0
        str_row2 = 0

        # Row 1
        while col < temp_sheet.ncols:
            if isinstance(temp_sheet.cell_value(start, col), str):
                str_row1 += 1
            col += 1

        # Reset variables
        col = 0
        start += 1

        # Row 2
        while col < temp_sheet.ncols:
            if isinstance(temp_sheet.cell_value(start, col), str):
                str_row2 += 1
            col += 1

        ## If the top row has more strings than the bottom row, then the top row must be the header
        if str_row1 > str_row2:
            return start
        # If not, then we probably don't have a header, so move back up one row
        else:
            return start - 1
    # If we still aren't sure, traverse one row down from the MV box and start from there
    return traverse_missing_value(temp_sheet) + 1


# Traverse all cells in a row. If you find new data in a cell, add it to the list.
# Outputs a list of cell data for the specified row.
def cells_right_metadata(workbook, sheet, row, col):
    col_loop = 0
    cell_data = []
    temp_sheet = workbook.sheet_by_name(sheet)
    while col_loop < temp_sheet.ncols:
        col += 1
        col_loop += 1
        try:
            if temp_sheet.cell_value(row, col) != xlrd.empty_cell and temp_sheet.cell_value(row, col) != '':
                cell_data.append(temp_sheet.cell_value(row, col))
        except IndexError:
            continue

    return cell_data


# Traverse all cells in a column moving downward. Primarily created for the metadata sheet, but may use elsewhere
# Check the cell title, and switch it to
def cells_down_metadata(workbook, sheet, row, col, finalDict):
    row_loop = 0
    pub_cases = ['pubDOI', 'pubYear', 'pubAuthor', 'pubJournal', 'pubIssue', 'pubVolume', 'pubTitle', 'pubPages',
                 'pubReportNumber', 'pubAbstract', 'pubAlternateCitation']
    geo_cases = ['latMin', 'lonMin', 'lonMax', 'latMax', 'elevation', 'siteName', 'location']
    funding_cases = ['agency', 'grant']

    # Temp Dictionaries
    geo_temp = {}
    general_temp = {}
    pub_temp = {}
    funding_temp = OrderedDict()

    temp_sheet = workbook.sheet_by_name(sheet)

    # Loop until we hit the max rows in the sheet
    while row_loop < temp_sheet.nrows:
        try:
            # If there is content in the cell...
            if temp_sheet.cell_value(row, col) != xlrd.empty_cell and temp_sheet.cell_value(row, col) != '':

                # Convert title to correct format, and grab the cell data for that row
                title_formal = temp_sheet.cell_value(row, col)
                title_json = name_to_jsonld(title_formal)
                cell_data = cells_right_metadata(workbook, sheet, row, col)

                # If we don't have a title for it, then it's not information we want to grab
                if title_json:

                    # Geo
                    if title_json in geo_cases:
                        geo_temp = compile_temp(geo_temp, title_json, cell_data)

                    # Pub
                    elif title_json in pub_cases:
                        pub_temp = compile_temp(pub_temp, title_json, cell_data)

                    # Funding
                    elif title_json in funding_cases:
                        funding_temp[title_json] = cell_data

                    # All other cases do not need fancy structuring
                    else:
                        general_temp = compile_temp(general_temp, title_json, cell_data)

        except IndexError:
            continue
        row += 1
        row_loop += 1

    ############################
    ##     DOI RESOLVER       ##
    ############################
    """
    Run the DOI Resolver on the final dictionary. That way, any data we get from the DOI resolver will overwrite
    what we parser from the file.
    """
    funding_temp = compile_fund(funding_temp)
    geo = compile_geo(geo_temp)
    pub = DOIResolver().run(compile_pub(pub_temp))

    finalDict['@context'] = "context.jsonld"
    finalDict['pub'] = pub
    finalDict['funding'] = funding_temp
    finalDict['geo'] = geo

    # Add remaining general items
    for k, v in general_temp.items():
        finalDict[k] = v

    return


# Returns an attributes dictionary
def cells_right_datasheets(workbook, sheet, row, col, colListNum):
    temp_sheet = workbook.sheet_by_name(sheet)
    empty = ["N/A", " ", xlrd.empty_cell, "", "NA"]

    # Iterate over all attributes, and add them to the column if they are not empty
    attrDict = OrderedDict()
    attrDict['number'] = colListNum

    # Get the data type for this column
    attrDict['dataType'] = str(get_data_type(temp_sheet, colListNum))

    # Separate dict for climateInterp block
    climInDict = {}

    try:
        # Loop until we hit the right-side boundary
        while col < temp_sheet.ncols:
            cell = temp_sheet.cell_value(row, col)

            # If the cell contains any data, grab it
            if cell not in empty and "Note:" not in cell:

                title_in = name_to_jsonld(temp_sheet.cell_value(1, col))

                # Special case if we need to split the climate interpretation string into 3 parts
                if title_in == 'climateInterpretation':
                    if cell in empty:
                        climInDict['parameter'] = ''
                        climInDict['parameterDetail'] = ''
                        climInDict['interpDirection'] = ''
                    else:
                        cicSplit = cell.split('.')
                        climInDict['climateParameter'] = cicSplit[0]
                        climInDict['climateParameterDetail'] = cicSplit[1]
                        climInDict['interpDirection'] = cicSplit[2]

                # Special case to add these two categories to climateInterpretation
                elif title_in == 'seasonality' or title_in == 'basis':
                    climInDict[title_in] = temp_sheet.cell_value(row, col)

                # If the key is null, then this is a not a cell we want to add
                # We also don't want Data Type, because we manually check for the content data type later
                # Don't want it to overwrite the other data type.
                # Happens when we get to the cells that are filled with formatting instructions
                # Ex. "Climate_interpretation_code has 3 fields separated by periods..."
                elif title_in is (None or 'dataType'):
                    pass

                # Catch all other cases
                else:
                    attrDict[title_in] = cell
            col += 1

    except IndexError:
        print("Cell Right datasheets index error")

    attrDict['climateInterpretation'] = climInDict
    return attrDict


# Adds all measurement table data to the final dictionary
# Returns: Dictionary
def cells_down_datasheets(filename, workbook, sheet, row, col):
    # Create a dictionary to hold each column as a separate entry
    paleoDataTableDict = OrderedDict()

    # Iterate over all the short_name variables until we hit the "Data" cell, or until we hit an empty cell
    # If we hit either of these, that should mean that we found all the variables
    # For each short_name, we should create a column entry and match all the info for that column
    temp_sheet = workbook.sheet_by_name(sheet)
    columnsTop = []
    commentList = []
    colListNum = 1
    iter_var = True

    # Loop for all variables in top section
    try:
        while iter_var:

            cell = temp_sheet.cell_value(row, col).lstrip().rstrip()
            if (cell == 'Data') or (cell == 'Missing Value') \
                    or (cell == 'The value or character string used as a placeholder for missing values'):
                break
            else:
                variable = name_to_jsonld(temp_sheet.cell_value(row, col))

                # If the cell isn't blank or empty, then grab the data
                # Special case for handling comments since we want to stop them from being inserted at column level
                if variable == 'comments':
                    for i in range(1, 3):
                        if cell_occupied(temp_sheet, row, i):
                            commentList.append(temp_sheet.cell_value(row, i))

                # All other cases, create a list of columns, one dictionary per column
                elif temp_sheet.cell_value(row, col) != ('' and xlrd.empty_cell):
                    columnsTop.append(cells_right_datasheets(workbook, sheet, row, col, colListNum))
                    colListNum += 1
                row += 1

    except IndexError:
        pass

    # Add all our data pieces for this column into a new entry in the Measurement Table Dictionary
    paleoDataTableDict['paleoDataTableName'] = sheet
    paleoDataTableDict['filename'] = str(filename) + '-' + str(sheet) + ".csv"
    paleoDataTableDict['missingValue'] = 'NaN'

    # If comments exist, insert them at table level
    if commentList:
        paleoDataTableDict['comments'] = commentList[0]
    paleoDataTableDict['columns'] = columnsTop

    # Reset list back to null for next loop
    commentList = []
    return paleoDataTableDict


"""
CHRONOLOGY HELPER METHODS
"""


# This was the temporary, inconsistent way to get chron data as a whole chunk.
# Accept: sheet (obj) / Return: dictionary
def blind_data_capture(temp_sheet):
    chronology = OrderedDict()
    start_row = traverse_to_chron_var(temp_sheet)
    for row in range(start_row, temp_sheet.nrows):
        key = str(row)
        row_list = []
        for col in range(0, temp_sheet.ncols):
            row_list.append(temp_sheet.cell_value(row, col))
        chronology[key] = row_list

    return chronology


# Count the number of chron variables:
# Accepts: temp_sheet(obj) / Returns: total_count(int)
def count_chron_variables(temp_sheet):
    total_count = 0
    start_row = traverse_to_chron_var(temp_sheet)
    while temp_sheet.cell_value(start_row, 0) != '':
        total_count += 1
        start_row += 1
    return total_count


# Capture all the vars in the chron sheet (for json-ld output)
# Accepts: sheet, start_row(int) / Returns: column data (list of dicts)
def get_chron_var(temp_sheet, start_row):
    col_dict = OrderedDict()
    out_list = []
    column = 1

    while (temp_sheet.cell_value(start_row, 0) != '') and (start_row < temp_sheet.nrows):
        short_cell = temp_sheet.cell_value(start_row, 0)
        units_cell = temp_sheet.cell_value(start_row, 1)
        long_cell = temp_sheet.cell_value(start_row, 2)

        ## Fill the dictionary for this column
        col_dict['number'] = column
        col_dict['parameter'] = short_cell
        col_dict['description'] = long_cell
        col_dict['units'] = units_cell
        out_list.append(col_dict.copy())
        start_row += 1
        column += 1

    return out_list


# Traverse down to the first row that has chron data
# Accepts: temp_sheet(obj) / Returns: row(int)
def traverse_to_chron_data(temp_sheet):
    traverse_row = traverse_to_chron_var(temp_sheet)
    reference_var = temp_sheet.cell_value(traverse_row, 0)

    # Traverse past all the short_names, until you hit a blank cell (the barrier)
    while temp_sheet.cell_value(traverse_row, 0) != '':
        traverse_row += 1
    # Traverse past the empty cells until we hit the chron data area
    while temp_sheet.cell_value(traverse_row, 0) == '':
        traverse_row += 1

    # Check if there is a header row. If there is, move past it. We don't want that data
    if temp_sheet.cell_value(traverse_row, 0) == reference_var:
        traverse_row += 1

    return traverse_row

"""
Traverse down to the row that has the first variable
Accepts: temp_sheet(obj) / Returns: row (int)
"""
def traverse_to_chron_var(temp_sheet):
    row = 0
    while row < temp_sheet.nrows - 1:
        if 'Parameter' in temp_sheet.cell_value(row, 0):
            row += 1
            break
        row += 1

    return row

"""
Capture all data in for a specific chron data row (for csv output)
Accepts: temp_sheet(obj), row(int), total_vars(int) / Returns: data_row(list)
"""
def get_chron_data(temp_sheet, row, total_vars):
    data_row = []
    missing_val_list = ['none', 'na', '', '-']
    for i in range(0, total_vars):
        cell = temp_sheet.cell_value(row, i)
        if isinstance(cell, str):
            cell = cell.lower()
        if cell in missing_val_list:
            cell = 'NaN'
        data_row.append(cell)
    return data_row


"""
PARSER
"""


def parser():

    excel_files = []

    # Ask user if they want to run the Chronology sheets or flatten the JSON files.
    # This is an all or nothing choice
    # need_response = True
    # while need_response:
    #     chron_run = input("Run Chronology? (y/n)\n")
    #     if chron_run == 'y' or 'n':
    #         flat_run = input("Flatten JSON? (y/n)\n")
    #         if flat_run == 'y' or 'n':
    #             need_response = False

    # For testing, assume we don't want to run these to make things easier for now.
    chron_run = 'y'
    flat_run = 'n'

    # Display a dialog box that let's the user browse for the directory with all their excel files.
    # root = tkinter.Tk()
    # root.withdraw()
    # currdir = os.getcwd()
    # tempdir = tkinter.filedialog.askdirectory(parent=root, initialdir='/Users/chrisheiser1/Dropbox/GeoChronR/', title='Please select a directory')

    # if len(tempdir) > 0:
    #     print("Directory: " + tempdir)
    # os.chdir(tempdir)
    # os.chdir('/Users/chrisheiser1/Dropbox/GeoChronR/chronologiesToBeFormatted/')
    os.chdir('/Users/chrisheiser1/Desktop/')

    # Add all excel files from user-specified directory, or from current directory
    # Puts all file names in a list we iterate over
    for file in os.listdir():
        if file.endswith(".xls") or file.endswith(".xlsx"):
            excel_files.append(file)

    # Loop over all the lines (filenames) that are in the chosen directory
    print("Processing files: ")
    for current_file in excel_files:

        datasheetNameList = []
        chronsheetNameList = []
        chron_combine = []
        data_combine = []
        finalDict = OrderedDict()

        # File name without extension
        name = os.path.splitext(current_file)[0]
        print(name)

        # For our current excel workbook, set each worksheet to a variable
        # Set worksheet variables dynamically, based on the worksheet name
        workbook = xlrd.open_workbook(current_file)

        ## Most common sheets. If find sheet with matching name, set to variable
        for sheet in workbook.sheet_names():

            if 'Metadata' in sheet:
                metadata = workbook.sheet_by_name(sheet)
                metadata_str = 'Metadata'
            elif 'Chronology' in sheet:
                chronsheetNameList.append(sheet)
            elif 'Data' in sheet:
                datasheetNameList.append(sheet)

                # These sheets exist, but are not being used so far
                # elif new_name == 'ProxyList':
                #     proxyList = workbook.sheet_by_index(workbook.sheet_names().index('ProxyList'))
                #     proxyList_str = 'ProxyList'
                # elif sheet == 'About':
                #     about = workbook.sheet_by_index(workbook.sheet_names().index('About'))
                #     about_str = 'About'

        ###########################
        ## METADATA WORKSHEETS   ##
        ###########################

        # Run the method for adding metadata info to finalDict
        cells_down_metadata(workbook, metadata_str, 0, 0, finalDict)

        ###########################
        ##   DATA WORKSHEETS     ##
        ###########################

        # Loop over the data sheets we know exist
        for sheet_str in datasheetNameList:
            sheet_str = cells_down_datasheets(name, workbook, sheet_str, 2, 0)
            data_combine.append(sheet_str)

        # Add measurements to the final dictionary
        finalDict['paleoData'] = data_combine

        ###########################
        ## CHRONOLOGY WORKSHEETS ##
        ###########################

        chron_dict = OrderedDict()

        # Check if the user opted to run the chronology sheet
        if chron_run == 'y':
            for sheet_str in chronsheetNameList:
                temp_sheet = workbook.sheet_by_name(sheet_str)
                chron_dict['filename'] = str(name) + '-' + str(sheet_str) + '.csv'

                # Create a dictionary that has a list of all the columns in the sheet
                start_row = traverse_to_chron_var(temp_sheet)
                columns_list_chron = get_chron_var(temp_sheet, start_row)
                chron_dict['columns'] = columns_list_chron
                chron_combine.append(chron_dict)

            # Add chronology into the final dictionary
            finalDict['chronData'] = chron_combine


        ############################
        ## FILE NAMING AND OUTPUT ##
        ############################

        # Creates the directory 'output' if it does not already exist
        if not os.path.exists('output/' + str(name)):
            os.makedirs('output/' + str(name))

        # CSV - DATA
        for sheet_str in datasheetNameList:
            output_csv_datasheet(workbook, sheet_str, name)
        del datasheetNameList[:]

        # CSV - CHRONOLOGY
        if chron_run == 'y':
            for sheet_str in chronsheetNameList:
                output_csv_chronology(workbook, sheet_str, name)

        # JSON LD
        new_file_name_jsonld = str(name) + '/' + str(name) + '.lipd'
        file_jsonld = open('output/' + new_file_name_jsonld, 'w')
        file_jsonld = open('output/' + new_file_name_jsonld, 'r+')

        # Write finalDict to json-ld file with dump. Dump outputs a readable json hierarchy
        json.dump(finalDict, file_jsonld, indent=4)

        if flat_run == 'y':
            # Flatten the JSON LD file, and output it to its own file
            flattened_file = flatten.run(finalDict)
            new_file_flat_json = str(name) + '/' + str(name) + '_flat.lipd'
            file_flat_jsonld = open('output/' + new_file_flat_json, 'w')
            file_flat_jsonld = open('output/' + new_file_flat_json, 'r+')
            json.dump(flattened_file, file_flat_jsonld, indent=0)
            # validate_flat = validator_test.run('output/' + new_file_flat_json)


parser()

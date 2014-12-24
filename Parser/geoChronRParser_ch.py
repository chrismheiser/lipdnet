import xlrd,os,csv
import json
from collections import OrderedDict
import json_validator_ch


## GLOBAL VARIABLES
finalDict = OrderedDict()

## Use this to ouput data columns to a csv file
def output_csv(workbook, sheet, name):

    json_naming = name_to_jsonld(sheet)
    temp_sheet = workbook.sheet_by_name(sheet)
    csv_folder_and_name = str(name) + '/' + str(name) + str(json_naming) + '.csv'
    csv_full_path = 'output/' + csv_folder_and_name
    file_csv = open(csv_full_path, 'w', newline='')
    w = csv.writer(file_csv)

    try:
        ## Loop to find starting data cell
        for i in range(0, temp_sheet.nrows):

            ## Find the first cell that has a number value, or has NA
            ## Then backtrack one row to where all the variable names are
            if isinstance(temp_sheet.cell_value(i, 0), int) or isinstance(temp_sheet.cell_value(i, 0), float)\
                or temp_sheet.cell_value(i, 0) == 'NA' or temp_sheet.cell_value(i, 0) == 'N/A':
                current_row = i - 1
                break

        ## Loop over all variable names, and count how many there are. We need to loop this many times.
        var_limit = 0
        while cell_check(workbook, sheet, current_row, var_limit):
            var_limit += 1

        ## Until we reach the bottom worksheet
        current_row += 1
        while current_row < temp_sheet.nrows:
            data_list = []

            ## Move down a row and go back to column 0
            current_column = 0

            ## Until we reach the right side worksheet
            while current_column < var_limit:

                # Increment to column 0, and grab the cell content
                cell_value = temp_sheet.cell_value(current_row, current_column)
                data_list.append(cell_value)
                current_column += 1
            w.writerow(data_list)
            current_row += 1

    except IndexError:
        pass

    file_csv.close()
    return

## Check an array to see if it is a single item or not
## Returns Boolean
def single_item(array):
    if len(array) == 1:
        return True
    return False

## Do cell_check to see if there is any content to retrieve
## Returns Boolean
def cell_check(workbook, sheet, row, col):
    temp_sheet = workbook.sheet_by_name(sheet)
    try:
        if temp_sheet.cell_value(row, col) != "N/A" \
            and temp_sheet.cell_value(row, col) != " " \
            and temp_sheet.cell_value(row, col) != xlrd.empty_cell\
            and temp_sheet.cell_value(row, col) != "":
            return True
        return False
    except IndexError:
        pass


## Convert formal titles to camelcase json_ld text that matches our context file
## Keep a growing list of all titles that are being used in the json_ld context
def name_to_jsonld(title_in):

    ## Sheet names
    if title_in == 'Metadata':
        title_out = 'metadata'
    elif title_in == 'Chronology':
        title_out = 'chronology'
    elif title_in == 'Data (QC)' or title_in == 'Data(QC)':
        title_out = 'dataQC'
    elif title_in == 'Data (original)' or title_in == 'Data(original)':
        title_out = 'dataOriginal'
    elif title_in == 'Data':
        title_out = 'data'
    elif title_in == 'ProxyList':
        title_out = 'proxyList'
    elif title_in == 'About':
        title_out = 'about'

    ## Metadata variables
    elif title_in == 'DOI':
        title_out = 'pubDOI'
    elif title_in == 'Year':
        title_out = 'pubYear'
    elif title_in == 'Investigators (Lastname, first; lastname2, first2)':
        title_out = 'authors'
    elif title_in == 'Site name':
        title_out = 'siteName'
    elif title_in == 'Northernmost latitude (decimal degree, South negative, WGS84)':
        title_out = 'latMax'
    elif title_in == 'Southernmost latitude (decimal degree, South negative, WGS84)':
        title_out = 'latMin'
    elif title_in == 'Easternmost longitude (decimal degree, West negative, WGS84)':
        title_out = 'longMax'
    elif title_in == 'Westernmost longitude (decimal degree, West negative, WGS84)':
        title_out = 'longMin'
    elif title_in == 'elevation (m), below sea level negative':
        title_out = 'elevationVal'
    elif title_in == 'Collection_Name (typically a core name)':
        title_out = 'collectionName'

    ## Measurement Variables
    elif title_in == 'Method':
        title_out = 'method'
    elif title_in == 'Material':
        title_out = 'material'
    elif title_in == 'Archive':
        title_out = 'archive'
    elif title_in == 'Data_Type':
        title_out = 'dataType'
    elif title_in == 'Basis of climate relation':
        title_out = 'basis'
    elif title_in == 'Detail':
        title_out = 'detail'
    elif title_in == 'Error':
        title_out = 'error'
    elif title_in == 'Seasonality':
        title_out = 'seasonality'
    elif title_in == 'What':
        title_out = 'longName'
    elif title_in == 'Climate_intepretation_code':
        title_out = 'climateInterpretation'
    elif title_in == 'Climate_interpretation_code':
        title_out = 'climateInterpretation'
    elif title_in == 'Short_name':
        title_out = 'shortName'
    elif title_in == 'Units':
        title_out = 'units'
    elif title_in == 'notes' or title_in == 'Notes'\
            or title_in == 'Comments' or title_in == 'comments':
        title_out = 'comments'
    else:
        return

    return title_out

## Traverse all cells in a row. If you find new data in a cell, add it to the list.
## Outputs a list of cell data for the specified row.
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


## Traverse all cells in a column moving downward. Primarily created for the metadata sheet, but may use elsewhere
## Check the cell title, and switch it to
def cells_down_metadata(workbook, sheet, row, col):
    row_loop = 0
    special_cases = ['latMin', 'longMin', 'longMax', 'latMax', 'elevationVal', 'pubDOI', 'pubYear', 'authors']

    ## Special dictionaries to make nested block data
    lon_inner = {}
    elev_inner = {}
    lat_inner = {}
    bottomDict = {}
    pub_inner = {}

    lon_inner['units'] = 'decimalDegrees'
    lat_inner['units'] = 'decimalDegrees'
    elev_inner['units'] = 'm'
    temp_sheet = workbook.sheet_by_name(sheet)

    ## Loop until we hit the max rows in the sheet
    while row_loop < temp_sheet.nrows:
        try:
            ## If there is content in the cell...
            if temp_sheet.cell_value(row, col) != xlrd.empty_cell and temp_sheet.cell_value(row, col) != '':

                ## Convert title to correct format, and grab all data for that row
                title_formal = temp_sheet.cell_value(row, col)
                title_json = name_to_jsonld(title_formal)
                cell_data = cells_right_metadata(workbook, sheet, row, col)

                ## If we don't have a title for it, then it's not information we want to grab
                if not title_json:
                    pass

                ## Handle special block of creating GEO dictionary
                elif title_json in special_cases:
                    if title_json == 'latMax':
                        if single_item(cell_data):
                            lat_inner['max'] = cell_data[0]
                        else:
                            lat_inner['max'] = cell_data
                    elif title_json == 'latMin':
                        if single_item(cell_data):
                            lat_inner['min'] = cell_data[0]
                        else:
                            lat_inner['min'] = cell_data
                    elif title_json == 'longMax':
                        if single_item(cell_data):
                            lon_inner['max'] = cell_data[0]
                        else:
                            lon_inner['max'] = cell_data
                    elif title_json == 'longMin':
                        if single_item(cell_data):
                            lon_inner['min'] = cell_data[0]
                        else:
                            lon_inner['min'] = cell_data
                    elif title_json == 'elevationVal':
                        if single_item(cell_data):
                            elev_inner['value'] = cell_data[0]
                        else:
                            elev_inner['value'] = cell_data
                    elif title_json == 'pubDOI':
                        if single_item(cell_data):
                            pub_inner['DOI'] = cell_data[0]
                        else:
                            pub_inner['DOI'] = cell_data
                    elif title_json == 'pubYear':
                        if single_item(cell_data):
                            pub_inner['year'] = int(cell_data[0])
                        else:
                            pub_inner['year'] = cell_data
                    elif title_json == 'authors':
                        if single_item(cell_data):
                            pub_inner['authors'] = cell_data[0]
                        else:
                            pub_inner['authors'] = cell_data

                ## All other cases do not need fancy structuring
                else:
                    if single_item(cell_data):
                        bottomDict[title_json] = cell_data[0]
                    elif len(cell_data) == 0:
                        pass
                    else:
                        bottomDict[title_json] = cell_data

        except IndexError:
            continue
        row += 1
        row_loop += 1

    ## Wait until all processing is finished, then combine all GEO elements and add to final dictionary
    geo = {'longitude': lon_inner,
            'latitude': lat_inner,
            'elevation': elev_inner}
    finalDict['@context'] = "context.jsonld"
    finalDict['geo'] = geo
    finalDict['pub'] = pub_inner

    ## Add all dict items without adding in all the extra braces
    for k, v in bottomDict.items():
        finalDict[k] = v

    return



## Returns an attributes dictionary
def cells_right_datasheets(workbook, sheet, row, col, colListNum):
    temp_sheet = workbook.sheet_by_name(sheet)

    ## Iterate over all attributes, and add them to the column if they are not empty
    attrDict = OrderedDict()
    attrDict['column'] = colListNum

    ## Separate dict for climateInterp block
    climInDict = {}

    try:
        ## Loop until we hit the right-side boundary
        while col < temp_sheet.ncols:

            ## If the cell contains any data, grab it
            if temp_sheet.cell_value(row, col) != "N/A" \
                    and temp_sheet.cell_value(row, col) != " " \
                    and temp_sheet.cell_value(row, col) != xlrd.empty_cell\
                    and temp_sheet.cell_value(row, col) != "":

                title_in = name_to_jsonld(temp_sheet.cell_value(1, col))

                ## Special case if we need to split the climate interpretation string into 3 parts
                if title_in == 'climateInterpretation':
                    cicSplit = temp_sheet.cell_value(row, col).split('.')
                    climInDict['parameter'] = cicSplit[0]
                    climInDict['parameterDetail'] = cicSplit[1]
                    climInDict['interpDirection'] = cicSplit[2]

                ## Special case to add these two categories to climateInterpretation
                elif title_in == 'seasonality' or title_in == 'basis':
                    climInDict[title_in] = temp_sheet.cell_value(row, col)

                ## If the key is null, then this is a not a cell we want to add
                ## Happens when we get to the cells that are filled with formatting instructions
                ## Ex. "Climate_interpretation_code has 3 fields separated by periods..."
                elif title_in is None:
                    pass

                # All other cases, change to json-ld naming
                else:
                    contents = temp_sheet.cell_value(row, col)
                    ## Inert the variable into the attributes dictionary
                    attrDict[title_in] = contents

            ## Only add climateInterp dict if it's not empty
            if climInDict:
                attrDict['climateInterpretation'] = climInDict
            col += 1

    except IndexError:
        pass

    return attrDict

## Returns nothing, but adds all measurement table data to the final dictionary
def cells_down_datasheets(filename, workbook, sheet, row, col):

    ## Create a dictionary to hold each column as a separate entry
    measTableDict = OrderedDict()

    ## Iterate over all the short_name variables until we hit the "Data" cell, or until we hit an empty cell
    ## If we hit either of these, that should mean that we found all the variables
    ## For each short_name, we should create a column entry and match all the info for that column
    temp_sheet = workbook.sheet_by_name(sheet)
    measTableName = name_to_jsonld(sheet)
    columnsTop = []
    commentList = []
    colListNum = 1

    ## Loop downward until you hit the "Data" box
    try:
        while temp_sheet.cell_value(row, col) != 'Data':

            variable = name_to_jsonld(temp_sheet.cell_value(row, col))

            ## If the cell isn't blank or empty, then grab the data
            ## Special case for handling comments since we want to stop them from being inserted at column level
            if variable == 'comments':
                for i in range(1,3):
                    if cell_check(workbook, sheet, row, i):
                        commentList.append(temp_sheet.cell_value(row, i))

            ## All other cases, create a list of columns, one dictionary per column
            elif temp_sheet.cell_value(row, col) != '' and temp_sheet.cell_value(row, col) != xlrd.empty_cell:
                columnsTop.append(cells_right_datasheets(workbook, sheet, row, col, colListNum))
                colListNum += 1
            row += 1

    except IndexError:
        pass

    ## Add all our data pieces for this column into a new entry in the Measurement Table Dictionary
    measTableDict['measTableName'] = measTableName
    measTableDict['filename'] = str(filename) + str(measTableName) + ".csv"

    ## If comments exist, insert them at table level
    if commentList:
        measTableDict['comments'] = commentList[0]
    measTableDict['columns'] = columnsTop

    ## Reset list back to null for next loop
    commentList = []
    return measTableDict



######################### PARSER ################### PARSER ############################################

def parser():

    ## Ask the user if their excel files are in the current directory, or to specify a file path
    default_path = 'xlsfiles'
    print("Are your files stored in the current 'xlsfiles' directory? (y/n)")
    answer = input()
    print("\n")

    # Specify a directory path
    if answer is "n":
        print("Please specify the path where your files are stored: ")
        print("(Ex: /Users/bobAlice/Documents/excelfiles)")
        user_path = input()
        os.chdir(user_path)

    # Use current directory
    else:
        os.chdir(default_path)

    ## Add all excel files from user-specified directory, or from current directory
    ## Puts all file names in a list we iterate over
    excel_files = []
    for file in os.listdir():
        if file.endswith(".xls") or file.endswith(".xlsx"):
            excel_files.append(file)


    datasheetNameList = []
    # ## Loop over all the lines (filenames) that are in the txt file
    print("Processing files: ")
    for current_file in excel_files:
        print(current_file)

        ## For our current excel workbook, set each worksheet to a variable
        ## Set worksheet variables dynamically, based on the worksheet name
        workbook = xlrd.open_workbook(current_file)

        ## Most common sheets. If find sheet with matching name, set to variable
        for sheet in workbook.sheet_names():
            new_name = name_to_jsonld(sheet)
            data_original_str = None
            data_qc_str = None
            data_str = None

            if sheet == 'Metadata':
                metadata = workbook.sheet_by_index(workbook.sheet_names().index('Metadata'))
                metadata_str = 'Metadata'
            elif sheet == 'Chronology':
                chronology = workbook.sheet_by_index(workbook.sheet_names().index('Chronology'))
                chronology_str = 'Chronology'
            elif sheet == 'Data (QC)':
                data_qc = workbook.sheet_by_index(workbook.sheet_names().index('Data (QC)'))
                data_qc_str = 'Data (QC)'
                datasheetNameList.append(data_qc_str)
            elif sheet == 'Data(QC)':
                data_qc = workbook.sheet_by_index(workbook.sheet_names().index('Data(QC)'))
                data_qc_str = 'Data(QC)'
                datasheetNameList.append(data_qc_str)
            elif new_name == 'ProxyList':
                proxyList = workbook.sheet_by_index(workbook.sheet_names().index('ProxyList'))
                proxyList_str = 'ProxyList'
            elif sheet == 'Data (original)':
                data_original = workbook.sheet_by_index(workbook.sheet_names().index('Data (original)'))
                data_original_str = 'Data (original)'
                datasheetNameList.append(data_original_str)
            elif sheet == 'Data(original)':
                data_original = workbook.sheet_by_index(workbook.sheet_names().index('Data(original)'))
                data_original_str = 'Data(original)'
                datasheetNameList.append(data_original_str)
            elif sheet == 'About':
                about = workbook.sheet_by_index(workbook.sheet_names().index('About'))
                about_str = 'About'
            elif sheet == 'Data':
                data = workbook.sheet_by_index(workbook.sheet_names().index('Data'))
                data_str = 'Data'
                datasheetNameList.append(data_str)


        # Naming scheme
        # Use whatever string name comes before the file extension
        name = current_file

        if 'xlsfiles/' in name:
            name = name[9:]
        if '.xls' in name:
            name = name[:-4]
        if '.xlsx' in name:
            name = name[:-5]
        if '.' in name:
            name = name[:-1]

########################### METADATA WORKSHEET #######################################################################

        ## Below data do not have explicit cell locations
            #region = metadata.cell_value()
            #dataDOI = metadata.cell_value()
            #archiveType =
            #whoCollected =
            #whoAnalyzed =
            #whoEnteredinDB =

        ## Run the method for adding metadata info to finalDict
        cells_down_metadata(workbook, metadata_str, 0, 0)


##################################### DATA WORKSHEET #################################################################


        ## Need to handle cases where there is Data_QC, Data_original, or Data, or a combination of them.
        combined = []

        ## Loop over the data sheets we know exist
        for sheet_str in datasheetNameList:
            sheet_str = cells_down_datasheets(name, workbook, sheet_str, 2, 0)
            combined.append(sheet_str)

        ## Add all dict items without adding in all the extra braces
        finalDict['measurements'] = combined


########################## CHRONOLOGY WORKSHEET ######################################################################

        ## Below data do not have explicit cell locations
        # filename =
        # chronType =
        # comments =

        ## Parse units from the parenthesis on the column names
        # units =
        # type =

        chronTableName = metadata.cell_value(30, 1)

        # Create the chronology table dictionary
        chronTable = {}
        columnNumber = 1
        rowCellVars = 5
        colCellData = 0


        try:
            while chronology.cell_value(rowCellVars, 0) != xlrd.empty_cell and chronology.cell_value(rowCellVars, 0) != '':

                ## Four mandatory variables for each column
                ## Had to do separately because variable names are different in Excel file.
                column = {'column': columnNumber}
                shortName = {'shortName': chronology.cell_value(rowCellVars,0)}
                longName = {'longName': chronology.cell_value(rowCellVars, 1)}
                chronTable[columnNumber] = column

                ## Put all the data for this variable into a list
                rowCellData = 22
                dataList = []
                try:
                    while chronology.cell_value(rowCellData, colCellData) != xlrd.empty_cell and chronology.cell_value(rowCellData, colCellData) != '':
                        dataList.append(chronology.cell_value(rowCellData, colCellData))
                        rowCellData += 1

                except IndexError:
                    pass

                ## Put our list of data values in a dictionary
                chronDataDict = {'data': dataList}

                ## Add all our data pieces for this column into a new entry in the Measurement Table Dictionary
                chronTable[columnNumber] = column, shortName, longName

                ## Update counts for next loop
                rowCellVars += 1
                columnNumber += 1
                colCellData += 1

        except IndexError:
            pass

        ## Create a top level Chronology dictionary so we can give it a key
        chronTableDict = {}
        chronTableDict['chronTable'] = chronTable

  #########################  FILE NAMING AND OUTPUT #################################################################


        ## Combine everything we have into the final dictionary

        ## Creates the directory 'output' if it does not already exist
        if not os.path.exists('output/' + str(name)):
            os.makedirs('output/' + str(name))

        ## CSV
        for sheet_str in datasheetNameList:
            output_csv(workbook, sheet_str, name)
        del datasheetNameList[:]

        ## JSON LD
        new_file_name_jsonld = str(name) + '/' + str(name) + '.jsonld'
        file_jsonld = open('output/' + new_file_name_jsonld, 'w')
        file_jsonld = open('output/' + new_file_name_jsonld, 'r+')

        ## Write finalDict to json-ld file with dump
        ## Dump outputs into a readable json hierarchy
        json.dump(finalDict, file_jsonld, indent=4)

parser()
import xlrd,os,csv
#importing the jsonld * causes duplicate outputs

def parser():

    # Easier way to grab all the filenames from the text file
    with open('file_list.txt', 'rt') as f:
        data_file = set(f.read().split())


    ## Loop over all the lines (filenames) that are in the txt file
    for current_file in data_file:
        print(current_file)

        ## For our current excel workbook, set each worksheet to a variable
        ## This is the standard worksheet order (METADATA -> CHRONOLOGY -> DATA -> PROXYLIST -> OTHERS)
        workbook = xlrd.open_workbook(current_file)
        metadata = workbook.sheet_by_index(0)
        chronology = workbook.sheet_by_index(1)
        dataSheet = workbook.sheet_by_index(2)
        proxyList = workbook.sheet_by_index(3)

        ## Check what worksheets are in this workbook
        # print(workbook.sheet_names())

        # Print quantity of cols and rows for fun.
        # print(metadata.nrows, metadata.ncols)

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


########################### METADATA WORKSHEET #############################

        ##Below data do not have explicit cell locations
            #region = metadata.cell_value()
            #dataDOI = metadata.cell_value()
            #archiveType =
            #whoCollected =
            #whoAnalyzed =
            #whoEnteredinDB =

        ## Create the metadata dictionary
        metadataDict = {}
        pubYear = (metadata.cell_value(12,1))

        #Operations to slice together the PubString
        pubstringRm = metadata.cell_value(9,1).replace(","," ")
        pubStringSplit = pubstringRm.split()
        pubStringRip = pubStringSplit[0] + " and " + pubStringSplit[2] + " " + str(pubYear)
        pubString = pubStringRip

        #Choose first person from investigator cell
        investigatorSplit = metadata.cell_value(3,1).split(';')
        investigator = investigatorSplit[0]

        paleoArchiveName = name
        pubDOI = metadata.cell_value(17,1)
        siteName = metadata.cell_value(22,1)
        latMax = metadata.cell_value(23,1)
        latMin = metadata.cell_value(24,1)
        latUnits = 'decimalDegrees'
        longMax = metadata.cell_value(25,1)
        longMin = metadata.cell_value(26,1)
        longUnits = 'decimalDegrees'
        elevationVal = metadata.cell_value(27,1)
        elevationUnits = 'm'
        collectionName = metadata.cell_value(30,1)

        ## Create the nested block of dictionaries for the GEO portion
        longitude = {'longitude' : {'max' : longMax, 'min': longMin, 'units': longUnits}}
        latitude = {'latitude' : {'max': latMax, 'min': latMin, 'units': latUnits}}
        elevation = {'elevation' : {'value': elevationVal, 'units': elevationUnits}}
        geo = longitude, latitude, elevation

        ## Combine all metadata into the 'metadata' dictionary
        metadataDict['metadata'] = \
            {'paleoArchiveName': paleoArchiveName},\
            {'investigator': investigator},\
            {'pubYear': pubYear}, \
            {'pubString': pubString},\
            {'pubDOI': pubDOI}, \
            {'siteName': siteName},\
            {'geo': geo},\
            {'collectionName': collectionName}

        ## Print the Metadata Dictionary to make sure the output is okay.
        # for i in metadataDict:
        #     print(metadataDict[i])
        # print('\n\n')




##################################### DATA WORKSHEET #######################

        ## Create a dictionary to hold each column as a separate entry
        measTable = {}

        ## Iterate over all the short_name variables until we hit the "Data" cell, or until we hit an empty cell
        ## If we hit either of these, that should mean that we found all the variables
        ## For each short_name, we should create a column entry and match all the info for that column
        columnNumber = 1
        rowCellVars = 2
        colCellData = 0
        while dataSheet.cell_value(rowCellVars, 0) != 'Data' and dataSheet.cell_value(rowCellVars,0) != '':

            ## Iterate over all columns that do not include the 4 mandatory attributes listed below
            attrCols = [3,4,6,7,8,9,10,11]

            ## Four mandatory variables for each column
            ## Had to do separately because variable names are different in Excel file.
            column = {'column' : columnNumber}
            shortName = {'shortName' : dataSheet.cell_value(rowCellVars,0)}
            longName = {'longName' : dataSheet.cell_value(rowCellVars, 2)}
            units = {'units' : dataSheet.cell_value(rowCellVars, 5)}
            measTable[columnNumber] = column

            ## Iterate over all attributes, and add them to the column so long as they are not empty
            attrDict = {}
            for i in attrCols:
                try:
                    if dataSheet.cell_value(rowCellVars, i) != "N/A" and dataSheet.cell_value(rowCellVars, i) != "":
                        title = dataSheet.cell_value(1, i)

                        ## Special case if we need to split the climate interpretation cell
                        if title == "Climate_intepretation_code":
                                cicSplit = dataSheet.cell_value(rowCellVars,i).split('.')
                                contents = {'parameter': cicSplit[0], 'parameterDetail': cicSplit[1], 'interpDirection': cicSplit[2]}

                        ## Case for adding All other variables
                        else:
                            contents = dataSheet.cell_value(rowCellVars,i)

                        ## Inert the variable into the attributes dictionary
                        attrDict[title] = contents
                except IndexError:
                    pass

            # ## Put all the data for this variable into a list
            # ## Need to catch IndexError exception or else it will go out of range
            # ## Iterations were trying to go beyond the last available cell and then breaking the list
            # rowCellData = 12
            # dataList = []
            # try:
            #     while dataSheet.cell_value(rowCellData, colCellData) != xlrd.empty_cell:
            #         dataList.append(dataSheet.cell_value(rowCellData,colCellData))
            #         rowCellData += 1
            #
            # except IndexError:
            #     pass
            #
            # ## Put our list of data values in a dictionary
            # dataDict = {'data': dataList}

            ## Add all our data pieces for this column into a new entry in the Measurement Table Dictionary
            measTable[columnNumber] = column, shortName, longName, units, attrDict

            ## Update counts for next loop
            rowCellVars += 1
            columnNumber += 1
            colCellData += 1

        ## Create Top level Measurement Dictionary so we can give it a key
        measTableDict = {}
        measTableDict['MeasurementTable'] = measTable

        ## Print the measTable to make sure the output is okay
        # for i in measTable:
        #     print(measTable[i])
        # print('\n\n')


########################## CHRONOLOGY WORKSHEET ###############################

        ## Variables start at 5,0
        ## Data starts at 22,0

        ## Below data do not have explicit cell locations
        # filename =
        # chronType =
        # comments =

        ## Parse units from the parenthesis on the column names
        # units =

        # type =

        chronTableName = metadata.cell_value(30,1)

        # Create the chronology table dictionary
        chronTable = {}

        columnNumber = 1
        rowCellVars = 5
        colCellData = 0


        try:
            while chronology.cell_value(rowCellVars,0) != xlrd.empty_cell and chronology.cell_value(rowCellVars,0) != '':

                ## Four mandatory variables for each column
                ## Had to do separately because variable names are different in Excel file.
                column = {'column' : columnNumber}
                shortName = {'shortName' : chronology.cell_value(rowCellVars,0)}
                longName = {'longName' : chronology.cell_value(rowCellVars, 1)}
                chronTable[columnNumber] = column

                ## Put all the data for this variable into a list
                rowCellData = 22
                dataList = []
                try:
                    while chronology.cell_value(rowCellData, colCellData) != xlrd.empty_cell and chronology.cell_value(rowCellData, colCellData) != '':
                        dataList.append(chronology.cell_value(rowCellData,colCellData))
                        rowCellData += 1

                except IndexError:
                    pass

                ## Put our list of data values in a dictionary
                dataDict = {'data': dataList}

                ## Add all our data pieces for this column into a new entry in the Measurement Table Dictionary
                chronTable[columnNumber] = column, shortName, longName, dataDict

                ## Update counts for next loop
                rowCellVars += 1
                columnNumber += 1
                colCellData += 1

        except IndexError:
            pass

        ## Create a top level Chronology dictionary so we can give it a key
        chronTableDict = {}
        chronTableDict['ChronologyTable'] = chronTable

        ## Print the chronTable to make sure the output is okay.
        # for i in chronTable:
        #     print(chronTable[i])


  #########################  FILE NAMING AND OUTPUT #######################

        #Create jsonld and csv files with the filename we found
        new_file_name_jsonld = str(name) + '/' + str(name) + '.jsonld'
        new_file_name_csv = str(name) + '/' + str(name) + '.csv'

        # creates the directory 'folders' if it does not already exist
        if not os.path.exists('folders/' + str(name)):
            os.makedirs('folders/' + str(name))

        # creates the new jsonld and csv files
        file_jsonld = open('folders/' + new_file_name_jsonld, 'w')
        file_csv = open('folders/' + new_file_name_csv, 'w')

        # makes the jsonld and csv files read and writeable
        file_jsonld = open('folders/' + new_file_name_jsonld, 'r+')
        file_csv = open('folders/' + new_file_name_csv, 'r+')

        # makes sure that the context is definied in every jsonld file
        file_jsonld.write('{\n')
        file_jsonld.write('		"@context" : "context.jsonld"\n')
        ## Write Metadata Dictionary to file
        file_jsonld.write(str(metadataDict))
        file_jsonld.write(',\n\n\n')
        ## Write Measurement Dictionary to file
        file_jsonld.write(str(measTableDict))
        file_jsonld.write(',\n\n\n')
        ## Write Chronology Dictionary to file
        file_jsonld.write(str(chronTableDict))
        file_jsonld.write('}\n')
        file_jsonld.write('\n')


parser()
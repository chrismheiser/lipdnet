import xlrd
import os
#importing the jsonld * causes duplicate outputs

def parser():

    # Easier way to grab all the filenames from the text file
    with open('file_list.txt', 'rt') as f:
        data_file = set(f.read().split())

    for current_file in data_file:
        print(current_file)
        workbook = xlrd.open_workbook(current_file)
        metadata = workbook.sheet_by_index(0)
        data = workbook.sheet_by_index(1)
        chronology = workbook.sheet_by_index(2)
        proxyList = workbook.sheet_by_index(3)

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


        paleoArchiveName = name
        siteName = metadata.cell_value(22,1)
        collectionName = metadata.cell_value(30,1)
        region =
        geo = {'geo' : {

            {'longitude' : { "max" :  , "min": , "units" : },
            {'latitude' : { "max" : , "min": , "units" :  },
            {'elevation' : { "elevationValue": , "units": }
        }}
        pubDOI = metadata.cell_value(17,1)
        pubString =
        dataDOI =
        archiveType =
        investigator =
        pubYear = metadata.cell_value(12,1)
        units =
        whoCollected =
        whoAnalyzed =
        whoEnteredinDB =

        print("sitename : " + str(siteName))
        print("year: " + str(pubYear))

        #
        # #Create jsonld and csv files with the filename we found
        # new_file_name_jsonld = str(name) + '/' + str(name) + '.jsonld'
        # new_file_name_csv = str(name) + '/' + str(name) + '.csv'
        #
        # # creates the directory 'folders' if it does not already exist
        # if not os.path.exists('folders/' + str(name)):
        #     os.makedirs('folders/' + str(name))
        #
        # # creates the new jsonld and csv files
        # file_jsonld = open('folders/' + new_file_name_jsonld, 'w')
        # file_csv = open('folders/' + new_file_name_csv, 'w')
        #
        # # makes the jsonld and csv files read and writeable
        # file_jsonld = open('folders/' + new_file_name_jsonld, 'r+')
        # file_csv = open('folders/' + new_file_name_csv, 'r+')
        #
        # # makes sure that the context is definied in every jsonld file
        # file_jsonld.write('{\n')
        # file_jsonld.write('		"@context" : "context.jsonld"\n')
        # file_jsonld.write('}\n')
        # file_jsonld.write('\n')


parser()
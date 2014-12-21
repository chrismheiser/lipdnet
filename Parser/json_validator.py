# This file is going to be used as a compilation
# of all exceptions we are trying to catch within
# the json files.

from geoChronRParser import *
import json

##############################################################################

acceptable_keys = ['geo', 'investigators', 'pubYear', 'collectionName', \
                   'siteName', 'pubDOI', 'measurements']

##############################################################################

geo = ['elevation', 'longitude', 'latitude']

elevation = ['value', 'units']
longitude = ['max', 'units', 'min']
latitude = ['max', 'units', 'min']

##############################################################################

measurements = ['measTableName', 'filename', 'columns']

columns = ['column', 'shortName', 'longName', 'units', 'detail', 'dataType', \
           'method', 'material', 'error', 'seasonality', 'archive', \
           'climateInterpretation', 'basis']

climateInterpretation = ['parameterDetail', 'parameter', 'interpDirection']

##############################################################################

def validator():
    json_data = open(file_jsonld)
    data = json.load(json_data)

    for key in acceptable_keys:
        if key == 'geo':
            for next_key in geo:
                if next_key not in ['elevation', 'longitude', 'latitude']:
                    print('You have an incorrect key, ' + next_key + '.')
                else:
                    print('geo is correct!')

                # from here check if every item in the geo list
                # contains the correct value, i.e. int, str, etc.

        elif key == 'investigators':
            for i in data:
                if i == 'investigators':
                    if isinstance(data[i + 4], str):
                        print('investigators is the correct type!')
                    else:
                        print('investigators is not a string, fix!')

                else:
                    pass

        elif key == 'pubYear':
            for i in data:
                if i == 'pubYear':
                    if isinstance(data[i + 4], int):
                        print('pubYear is the correct type!')
                    else:
                        print('pubYear is not an integer, fix!')

                else:
                    pass

        elif key == 'collectionName':
            for i in data:
                if i == 'collectionName':
                    if isinstance(data[i + 4], str):
                        print('collectionName is the correct type!')
                    else:
                        print('collectionName is not a string, fix!')

                else:
                    pass

        elif key == 'siteName':
            for i in data:
                if i == 'siteName':
                    if isinstance(data[i + 4], str):
                        print('siteName is the correct type!')
                    else:
                        print('siteName is not a string, fix!')

                else:
                    pass

        elif key == 'pubDOI':
            for i in data:
                if i == 'pubDOI':
                    if isinstance(data[i + 4], str):
                        print('pubDOI is the correct type!')
                    else:
                        print('pubDOI is not a string, fix!')

                else:
                    pass

        elif key == 'measurements':
            for next_key in measurements:
                if next_key not in ['measTableName', 'filename', 'columns']:
                    print('You have an incorrect key, ' + next_key)
                else:
                    print('measurements is correct!')

                # from here check if every value in measurements contains
                # the correct value, i.e. int, str, etc.



    json_data.close()


validator()

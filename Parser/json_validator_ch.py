# This file is going to be used as a compilation
# of all exceptions we are trying to catch within
# the json files.

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

## Some values may be a list of items or one item.
## Remember to handle both cases
dictionaries = ["geo", "value", "longitude", "latitude", "pub", "climateInterpretation" ]
strings = ["@context", "units", "collectionName", "authors", "DOI", "siteName", "comments", "shortName", "longName", "archive", "detail", "method",
           "dataType", "basis", "seasonality", "parameter", "parameterDetail", "interpDirection", "filename", "measTableName"]
floats = ["value", "max", "min"]
integers = ["year", "column"]
lists = ["measurements", "columns"]


## Take in some key - value pair, and make sure the value is the correct type for that key.
def validate(key, value):
    if key in lists:
        if isinstance(value, list):
            return True
    elif key in integers:
        if isinstance(value, int):
            return True
    elif key in floats:
        if isinstance(value, float):
            return True
    elif key in strings:
        if isinstance(value, str):
            return True
    return False

## Take input list, and recurse down to find dictionaries and key-value pairs
def iterate_l(l):
    for items in range(len(l)):
        iterate_d(l[items])

## Take an input dictionary, and recurse down every time you find a nested dictionary
def iterate_d(d):
    for k, v in d.items():

        ## if value is a dictionary, then we need to expand that dictionary
        if isinstance(v, dict):
            iterate_d(v)

        ## if value is a list, throw it to special function to handle lists
        elif k == "measurements":
            iterate_l(v)

        ## if value is not a dictionary, we must have reached the bottom of the the nesting
        else:
            if validate(k,v):
                print("validated : {0} : {1}".format(k, v))
            else:
                print("invalid : {0} : {1}".format(k, v))


## main function to open the jsonld file, validate, and close again.
def run():
    json_path = 'test.jsonld'
    json_data = open(json_path)
    data = json.load(json_data)
    iterate_d(data)
    json_data.close()

run()
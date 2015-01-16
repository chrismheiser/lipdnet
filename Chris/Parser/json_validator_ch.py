"""
IDEAS:

1. We store the units in generic keys. [ time , coordinates, distance, liquid, depth, concentration]
    We say "Didn't recognize this unit. Is this a liquid?" etc.
    We look through the 'liquid' key, and if there is no match, we can add the unit.
    ** PROS: We don't have to do a bunch of backtracking and overhead work.
    ** CONS: This would require a lot more user interaction and attention

2. Every time we traverse and come across a short_name, add it to a global temp variable.
    Then, if we find an unrecognized unit, ask the user if they want to add based to dict by "short_name : unit_name"
    ** PROS: More automated and the user doesn't have to worry about inputting anything.
    ** CONS: Not every short_name is very helpful. i.e. the unit "AD" would best be categorized as
        'time' or 'date', but the current short_name is 'age_AD', which isn't great. We'd eventually have a messy
        synonyms dictionary that would take longer and longer to search.

    check two cases:
        a. short_name is on the same level as units
        b. short_name is on the level above units

3.
Units that we need to regulate :
Geo -> longitude -> units
Geo -> latitude -> units
Geo -> elevation -> units
measurements -> columns -> units

"""

import json

acceptable_pairs = {"distance": ["m", "meters", "km", "kilometers", "ft", "feet"],
                    "coordinates": ["decimaldegrees", "dd", "decimal degrees", "minutes", "m", "min", "seconds", "s", "sec"],
                    "interpDirection": ["positive", "pos", "p", "negative", "neg", "n"],
                    "dataType": ["n", 'y'],
                    "date": ["ad", "bc"]
                    }

acceptable_titles = ['distance', 'coordinates', 'date', 'dataType', 'interpDirection']

## Some values may be a list of items or one item.
## Remember to handle both cases
dictionaries = ["geo", "value", "longitude", "latitude", "pub", "climateInterpretation", 'elevation']
strings = ["@context", "units", "collectionName", "authors", "DOI", "siteName", "comments", "shortName", "longName",
           "archive", "detail", "method", "dataType", "basis", "seasonality", "parameter", "parameterDetail",
           "interpDirection", "filename", "measTableName", "material"]
floats = ["value", "max", "min"]
integers = ["year", "column"]
lists = ["measurements", "columns"]


"""
To make things easier, this function is meant to format all incoming names into lowercase
format. This way we don't need to hard code a bunch of different permutations of the same name.
Ex: age, Age, AGE. We can make it lowercase, and then check it against our list of acceptable short
names or units.
Accepts: String
Returns: String
"""
def to_lowercase(name):
    return name.lower()

"""
Specific methods validate values based on what type of unit they are.
These are for units that will remain constant. (hard-coded)
If there is something wrong with the validation, we'll move to the "unrecognized" method and ask user for verification.
Accepts: key, value
Returns: Boolean
"""
def coordinates(k, v):
    for i, j in v.items():
        if i == 'units':
            j = to_lowercase(j)

            ## We found a match. Return True - validated
            if j in acceptable_pairs['coordinates']:
                return True

            ## The unit value was not found in the database
            ## Throw to unrecognized function in ('longitude', 'M', 'coordinates') format.
            else:
                unrecognized(k, j, 'coordinates')

    ## Did not find 'units' key in this dictionary
    ## Validation fails
    return False

def distance(k, v):
    for i, j in v.items():
        if i == 'units':
            j = to_lowercase(j)
            if j in acceptable_pairs['distance']:
                return True
            else:
                unrecognized(k, j, 'distance')
    return False

def interp_dir(k, v):
    v = to_lowercase(v)
    if v in acceptable_pairs['interpDirection']:
        return True
    else:
        unrecognized(k, v, 'interpDirection')
    return False

def data_type(k, v):
    v = to_lowercase(v)
    if v in acceptable_pairs['dataType']:
        return True
    else:
        unrecognized(k, v, 'dataType')

## Needs special treatment. Have to grab short name and unit separately
def iter_special_lsts(shortLst_in, unitLst_in):
    for names in shortLst_in:
        print('short: {0} unit: {1}'.format(shortLst_in[names], unitLst_in[names]))
        pass

def short_unit(shortname_in, unitname_in):
    pass

def unrecognized(key, value):

    """
    This method will interact with the user
    If we enter here, then that means the validation failed somewhere prior,
    and we need to check for spelling anomalies or adding the new unit to the database
    Accepts: key, value
    Returns: None
    """

    ## Make sure the unit is correct and this is not a typo, etc.
    print("{0}:{1} not recognized. Is the entry correct? (yes/no)\n".format(key, value))
    user_check1 = input().lower()

    ## The entry is correct, but we don't have it yet.
    ## Ask what type of unit it is, and add it to the database
    if user_check1 == ("yes" or "y"):
        print('We can add this unit for future use. What type of unit is it?\n')
        print(acceptable_titles)
        user_unit = input()
        if user_unit in acceptable_titles:
            print('Adding {0} as an acceptable unit for {1}'.format(value, user_unit))
            acceptable_pairs[user_unit].append(value)

    ## The entry wasn't correct.
    elif user_check1 == ('no' or 'n'):


    else:
        print("Invalid answer. Let's try again")
        unrecognized(key, value)

## Take in some key - value pair, and make sure the value is the correct type for that key.
## This is a lower validation, as it doesn't necessarily check the value or units
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
    elif key in dictionaries:
        if isinstance(value, dict):
            return True
    return False

## Take input list, and recurse down to find dictionaries and key-value pairs
def iter_list(l):
    for items in range(len(l)):
        iter_dict(l[items])
"""
These two arrays will keep corresponding short names and units at matching indexes
Ex: shortname_lst[0] = 'age_ad'
    units_lst[0] = 'AD'
"""
shortname_lst = []
units_lst = []

## Take input dictionary, and recurse downward
def iter_dict(d):

    for k, v in d.items():

        ## Check that data structures are correct
        if not validate(k, v):
            print('incorrect format: {0}:{1}'.format(k, v))

        ## if value is a dictionary, then we need to expand that dictionary
        if isinstance(v, dict):
            iter_dict(v)

        ## if value is a list, throw it to special function to handle lists
        elif isinstance(v, list):
            iter_list(v)

        ## if value is not a dictionary, we must have reached the bottom of the the nesting
        else:
            ## If statements catch all the normal units that we can check manually
            if k == ('longitude' or 'latitude'):
                coordinates(k, v)
            elif k == 'elevation':
                distance(k, v)
            elif k == 'dataType':
                data_type(k, v)
            elif k == 'interpDirection':
                interp_dir(k, v)
            elif k == 'shortName':
                shortname_lst.append(v)
            elif k == 'units':
                units_lst.append(v)
            else:
                if not validate(k, v):
                    print('invalid: {0}:{1}'.format(k, v))
                    unrecognized(k, v)



    ## Find out how to use two arrays to validate short[X] with units[X]
    print(units_lst)
    print(shortname_lst)
    print('\n\n')


## main function to open the jsonld file, validate, and close again.
def run():
    json_path = 'test.jsonld'
    json_data = open(json_path)
    data = json.load(json_data)
    iter_dict(data)
    json_data.close()

run()
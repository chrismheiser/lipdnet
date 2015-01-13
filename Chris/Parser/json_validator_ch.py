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



synonyms = {"elevation": ["m", "meters", "Meters", "METERS", "M",
                           "km", "kilometers", "Kilometers", "KILOMETERS", "Km", "KM",
                           "ft", "feet", "Feet", "FEET", "Ft", "FT"],
            "coordinates": ["decimalDegrees", "dd", "Dd", "DD", "Decimal Degrees", "DecimalDegrees",
                               "minutes", "m", "min", "M", "MIN", "Minutes", "MINUTES",
                                "seconds", "s", "sec", "S", "SEC", "Seconds", "SECONDS"],
            "interpDirection": ["POSITIVE", "Positive", "positive", "pos", "Pos", "POS", "p", "P",
                                "NEGATIVE", "Negative", "negative", "neg", "Neg", "NEG", "n", "N"],
            "dataType": ["n", 'N'],
            "date": ["AD", "ad", "BC", "bc"]
            }
unit_titles = ['dataType', 'units', 'unit', 'interpDirection']

regulated_units = ['coordinates', 'concentration', 'time', 'distance', 'liquid', 'depth']

## Some values may be a list of items or one item.
## Remember to handle both cases
dictionaries = ["geo", "value", "longitude", "latitude", "pub", "climateInterpretation" ]
strings = ["@context", "units", "collectionName", "authors", "DOI", "siteName", "comments", "shortName", "longName", "archive", "detail", "method",
           "dataType", "basis", "seasonality", "parameter", "parameterDetail", "interpDirection", "filename", "measTableName", "material"]
floats = ["value", "max", "min"]
integers = ["year", "column"]
lists = ["measurements", "columns"]

## Find a way to grab the unit shortname when traversing downward
## When you move to another unit, wipe shortname and start over
temp_shortName = []

def value_check(key, value):

    """ If validates correctly, nothing happens
        If does not validate, give option to add new unit to database or pick from predefined units
        Returns Nothing """

    # ## Lump all coordinate units in the one synonym key
    # if shortname == ('longitude' or 'latitude' or 'elevation'):
    #     syn_key = 'coordinates'
    #
    # ## If not special case, then syn_key is that same as shortname
    # else:
    #     syn_key = shortname

    ## Loop through the synonyms keys
    for k, v in synonyms.items():

        ## If the input key matches one of out specific unit titles, then keep going
        if key in unit_titles:
            ## Loop through the key entry that
            for units in synonyms[k]:
                if value == units:
                    print("Synonym found: {0}\n".format(value))
                    return

        ## Their unit does not match anything in our database for that key
        else:
            ## Show them all the units that we have to choose from
            print("Unit not found : {0}. Did you mean one of these?\n {1}\n (yes/no)\n".format(value, v))
            user_ask = input()

            ## User picks one of the currently listed synonyms
            if user_ask == ("yes" or "y"):
                user_pick = input("Type your choice:\n")
                value = user_pick
                return

            ## Help the user add their unit to the database
            else:
                ## If they try to add a unit 3 times, and they say no to the verification, we'll just move on.
                for i in range(0, 3):

                    ## Do you want to add this to the database?
                    print("Would you like to add to the database?\n{0}:{1} \n".format(key, value))
                    user_add = input()

                    if user_add == ("yes" or "y"):

                        ## Verification step. Are you sure you want to add it?
                        print("Adding '{0}'.\n Are you sure you want to add this? (y/n)\n".format(k))
                        user_verify = input()

                        ##verfication passed, add to the dictionary in "shortname : unit" format
                        if user_verify == ('y' or 'yes'):
                            ## Temp placeholder. Figure out how to grab shortname and unit to add to synonyms{}
                            synonyms['shortName'] = 'unit'
                        return


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

output_list = []

## Take an input dictionary, and recurse down every time you find a nested dictionary
def iterate_d(d):

    loops = 0

    for k, v in d.items():
        temp_shortName.append(k)
        print(temp_shortName)

        ## if value is a dictionary, then we need to expand that dictionary
        if isinstance(v, dict):
            loops += 1
            output_list.append(k)
            iterate_d(v)

        ## if value is a list, throw it to special function to handle lists
        elif isinstance(v, list):
            loops += 1
            output_list.append(k)
            iterate_l(v)

        ## if value is not a dictionary, we must have reached the bottom of the the nesting
        else:
            if loops == 0:

                if validate(k, v):
                    value_check(k, v)
                    print("valid : {0} : {1}".format(k, v))

                else:
                    value_check(k, v)
                    print("invalid : {0} : {1}".format(k, v))

            elif loops == 1:

                if len(output_list) > 1:
                    output_list.remove(output_list[0])

                if validate(k, v):
                    value_check(k, v)
                    print("valid : {0} : {1} : {2}".format(output_list[0], k, v))

                else:
                    value_check(k, v)
                    print("invalid : {0} : {1} : {2}".format(output_list[0], k, v))

            elif loops == 2:

                if len(output_list) > 2:
                    output_list.remove(output_list[0])

                if validate(k, v):
                    value_check(k, v)
                    print("valid : {0} : {1} : {2} : {3}".format(output_list[0], output_list[1], k, v))

                else:
                    value_check(k, v)
                    print("invalid : {0} : {1} : {2} : {3}".format(output_list[0], output_list[1], k, v))



## main function to open the jsonld file, validate, and close again.
def run():
    json_path = 'test.jsonld'
    json_data = open(json_path)
    data = json.load(json_data)
    iterate_d(data)
    json_data.close()

run()
# This file is going to be used as a compilation
# of all exceptions we are trying to catch within
# the json files.

import json

##############################################################################

# use stored layers to store each key in later iterations
stored_layers = {"layer_one": "", "layer_two": "", "layer_three": "", "layer_four": ""}

synonyms = {"elev_units": ["m", "meters", "Meters", "METERS", "M",
                           "km", "kilometers", "Kilometers", "KILOMETERS", "Km", "KM",
                           "ft", "feet", "Feet", "FEET", "Ft", "FT"],
            "long_lat_units": ["decimalDegrees", "dd", "Dd", "DD", "Decimal Degrees", "DecimalDegrees",
                               "minutes", "m", "min", "M", "MIN", "Minutes", "MINUTES",
                                "seconds", "s", "sec", "S", "SEC", "Seconds", "SECONDS"],
            "interpDirection": ["POSITIVE", "Positive", "positive", "pos", "Pos", "POS", "p", "P",
                                "NEGATIVE", "Negative", "negative", "neg", "Neg", "NEG", "n", "N"],
            "dataType": ["n", 'N'],
            "date_units": ["AD", "ad", "BC", "bc"]
}

##############################################################################

# Some values may be a list of items or one item.
# Remember to handle both cases
dictionaries = ["geo", "value", "longitude", "latitude", "pub", "climateInterpretation" ]
strings = ["@context", "units", "collectionName", "authors", "DOI", "siteName", "comments", "shortName", "longName", "archive", "detail", "method",
           "dataType", "basis", "seasonality", "parameter", "parameterDetail", "interpDirection", "filename", "measTableName", "material"]
floats = ["value", "max", "min"]
integers = ["year", "column"]
lists = ["measurements", "columns"]

def value_check(key, value):

    """ If validates correctly, nothing happens
        If does not validate, give option to add new unit to database or pick from predefined units
        Returns Nothing """

    for k, v in synonyms.items():
        if key in ['units', 'interpDirection', 'dataType']:
            for i in k:
                if value in v:
                    print("Synonym found: {0}\n".format(value))
                    return

            # Their unit does not match anything in our database for that key
            else:
                # Show them all the units that we have to choose from
                user_ask = input("Error with units. Did you mean one of these?\n {0}\n (yes/no)\n".format(v))

                # User picks one of the currently listed synonyms
                if user_ask == "yes" or "y":
                    user_pick = input("Type your choice:\n")
                    value = user_pick
                    return

                # Help the user add their unit to the database
                else:
                    # If they try to add a unit 3 times, and they say no to the verification, we'll just move on.
                    for i in range(0,3):
                        user_add = input("Please type the unit you would like to add\n")
                        user_verify = input("You're about to add {0} to the {1} database.\n Are you sure you want to do this? (y/n)\n".format(user_add, k))
                        if user_verify == "yes" or "y":
                            v.append(user_add)
                            return


# Take in some key - value pair, and make sure the value is the correct type for that key.
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

# Take input list, and recurse down to find dictionaries and key-value pairs
def iterate_l(l):
    for items in range(len(l)):
        iterate_d(l[items])

output_list = []

# Take an input dictionary, and recurse down every time you find a nested dictionary
def iterate_d(d):

    loops = 0

    for k, v in d.items():

        # if value is a dictionary, then we need to expand that dictionary
        if isinstance(v, dict):
            loops += 1
            if loops == 1:
                stored_layers["layer_one"] = k
            elif loops == 2:
                stored_layers["layer_two"] = k
            elif loops == 3:
                stored_layers["layer_three"] = k
            else:
                stored_layers["layer_four"] = k

            iterate_d(v)

        # if value is a list, throw it to special function to handle lists
        elif isinstance(v, list):
            loops += 1
            if loops == 1:
                stored_layers["layer_one"] = k
            elif loops == 2:
                stored_layers["layer_two"] = k
            elif loops == 3:
                stored_layers["layer_three"] = k
            else:
                stored_layers["layer_four"] = k

            iterate_l(v)

        # if value is not a dictionary, we must have reached the bottom of the the nesting
        else:
            if loops == 0:

                if validate(k,v):
                    value_check(k, v)
                    print("valid : {0} : {1}".format(k, v))

                else:
                    value_check(k, v)
                    print("invalid : {0} : {1}".format(k, v))

            elif loops == 1:

                if validate(k,v):
                    print("valid : {0} : {1} : {2}".format(stored_layers["layer_one"], k, v))
                    value_check(k, v)

                else:
                    value_check(k, v)
                    print("invalid : {0} : {1} : {2}".format(stored_layers["layer_one"], k, v))

            elif loops == 2:

                if len(output_list) > 2:
                    output_list.remove(output_list[0])

                if validate(k,v):
                    print("valid : {0} : {1} : {2} : {3}".format(stored_layers["layer_one"], stored_layers["layer_two"], k, v))
                    value_check(k, v)

                else:
                    value_check(k, v)
                    print("invalid : {0} : {1} : {2} : {3}".format(stored_layers["layer_one"], stored_layers["layer_two"], k, v))



# main function to open the jsonld file, validate, and close again.
def run():
    json_path = 'test.jsonld'
    json_data = open(json_path)
    data = json.load(json_data)
    iterate_d(data)
    json_data.close()

run()
import json

elevation = ["m", "meters", "Meters", "METERS", "M", "km", "kilometers", "Kilometers", "KILOMETERS", "Km", "KM", "ft",
             "feet", "Feet", "FEET", "Ft", "FT"]

coordinates = ["decimalDegrees", "dd", "Dd", "DD", "Decimal Degrees", "DecimalDegrees",
                               "minutes", "m", "min", "M", "MIN", "Minutes", "MINUTES",
                                "seconds", "s", "sec", "S", "SEC", "Seconds", "SECONDS"]

interpDirection = ["POSITIVE", "Positive", "positive", "pos", "Pos", "POS", "p", "P",
                                "NEGATIVE", "Negative", "negative", "neg", "Neg", "NEG", "n", "N"]

dataType = ["n", 'N']
date = ["AD", "ad", "BC", "bc"]

dictionaries = ["geo", "value", "longitude", "latitude", "pub", "climateInterpretation" ]
strings = ["@context", "units", "collectionName", "authors", "DOI", "siteName", "comments", "shortName", "longName", "archive", "detail", "method",
           "dataType", "basis", "seasonality", "parameter", "parameterDetail", "interpDirection", "filename", "measTableName", "material"]
floats = ["value", "max", "min"]
integers = ["year", "column"]
lists = ["measurements", "columns"]

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

            if key == "unit":
                if value in synonyms:
                    return True
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
                        for i in range(0,3):

                            ## Do you want to add this to the database?
                            print("Would you like to add to the database?\n{0}:{1} \n".format(key, value))
                            user_add = input()

                            if user_add == ("yes" or "y"):

                                ## Verification step. Are you sure you want to add it?
                                print("Adding '{0}'.\n Are you sure you want to add this? (y/n)\n".format(k))
                                user_verify = input()

                                ##verfication passed, add to the dictionary in "shortname : unit" format
                                if user_verify == ('y' or 'yes'):
                                    # Temp placeholder. Figure out how to grab shortname and unit to add to synonyms{}
                                    synonyms['shortName'] = 'unit'
                                return
                    return True
            return False

def iterate_list(l):

    for item in range(len(l)):
        iterate(l[item])


def iterate(d):

    for k, v in d.items():

        if isinstance(v, dict):
            iterate(v)

        elif isinstance(v, list):
            iterate_list(v)

        else:
            if validate(k, v):
                print("Valid : {0} : {1}".format(k, v))
            print("Invalid : {0} : {1}").format(k, v)




def run():
    json_path = 'test.jsonld'
    json_data = open(json_path)
    data = json.load(json_data)
    iterate(data)
    json_data.close()


run()

import json
import re

"""
TO DO:
How do implement a growing database of units & acceptable values
Research django and mongoDB

"""


# If a value doesn't validate, interact with the user to find out how to handle the value.
def not_found(value, list_in):

    add = input("Value not recognized:{0}. Did you mean one of these?\n{1}\nEnter or type 'no' ".format(value, list_in))
    if add != 'no':
        add_verify = input("Are you sure you want to add {0} to the database?".format(add))
        if add_verify == 'no':
            not_found(value, list_in)
        else:
            # Need a real way to insert into a database right here.
            list_in.append(add)
            print("Added {0} to the database".format(add))

    return


# All path items are automatically strings. If you think it's an int or float, use this to attempt to convert it.
# Accepts: str
# Returns: int or float
def convert_num(number):
    try:
        return int(number)
    except ValueError:
        return float(number)


# Split the string path into two parts. Path : value
# Accept: str
# Return: list
def path_str_split(str_path):
    return re.split(r'[:]*', str_path)


# Lowercase units so that they're easier to validate
# Accept: str
# Return: str
def lowercase(units):
    if isinstance(units, str):
        return units.lower()


# Validate all the file paths in the flattened json list
# Accept: list
# Return: bool
def validation(list_in):

    geo = ['minutes', 'min', 'seconds', 'sec', 's', 'decimal degrees', 'decimaldegrees', 'dd']
    distance = ['meters', 'm', 'feet', 'ft', 'miles', 'mi', 'kilometers', 'km']
    months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october',
              'november', 'december', 'jan', 'feb', 'mar', 'apr', 'aug', 'sept', 'nov', 'dec']
    seasons = ['winter', 'spring', 'fall', 'summer', 'autumn']
    months_num = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

    # Group by similar types
    # Ints and Floats
    paths_geo_num = ["geo-longitude-min", "geo-longitude-max", "geo-latitude-max", "geo-latitude-min", "geo-elevation-value"]
    paths_geo_lonlat = ["geo-longitude-units", "geo-latitude-units"]

    error_count = 0

    # str, must be .json extension
    for item in list_in:

        item = path_str_split(item)
        key = item[0]
        value = item[1]
        print(key, value)

        # str, jsonld extenstion
        if "@context" == key:
            file_ext = value.split('.')[1]
            if not file_ext == 'jsonld':
                error_count += 1

        # str, can be anything
        elif "comments" == key:
            if not isinstance(value, str):
                error_count += 1

        # str, anything
        elif "siteName" == key:
            if not isinstance(value, str):
                error_count += 1

        # str, anything
        elif "collectionName" == key:
            if not isinstance(value, str):
                error_count += 1

        # decimal degrees, minutes, seconds
        elif key in paths_geo_lonlat:
            if not isinstance(value, str):
                error_count += 1
            elif lowercase(value) not in geo:
                error_count += 1

        # int, float
        elif key in paths_geo_num:
            number = convert_num(value)
            if not isinstance(number, (int and float)):
                error_count += 1

        # meters, feet, km, mi
        elif "geo-elevation-units" == key:
            if not isinstance(value, str):
                error_count += 1
            elif lowercase(value) not in distance:
                error_count += 1

        # str, anything
        elif "pub-authors" == key:
            if not isinstance(value, str):
                error_count += 1

        # int, float
        elif "pub-year" == key:
            number = convert_num(value)
            if not isinstance(number, int) or isinstance(number, float):
                error_count += 1

        # str, anything
        elif "measurements-measTableName" == key:
            if not isinstance(value, str):
                error_count += 1

        # str, csv file extension
        elif "measurements-filename" == key:
            file_ext = value.split('.')[1]
            if not file_ext == 'csv':
                error_count += 1

        # int
        elif "measurements-columns-column" == key:
            number = convert_num(value)
            if not isinstance(number, int):
                error_count += 1

        # str, (int, float, str)
        elif "measurements-columns-dataType" == key:
            if value != ('str' and 'int' and 'float'):
                error_count += 1

        # str, anything
        elif "measurements-columns-shortName" == key:
            if not isinstance(value, str):
                error_count += 1

        # str, anything
        elif "measurements-columns-longName" == key:
            if not isinstance(value, str):
                error_count += 1

        # int, float
        elif "measurements-columns-error" == key:
            number = convert_num(value)
            if not isinstance(number, (int and float)):
                error_count += 1

        # str, dependent on the shortname
        elif "measurements-columns-units" == key:
            if not isinstance(value, str):
                error_count += 1

            # Check if this unit matches what should go with this shortname

        # str, anything
        elif "measurements-columns-archive" == key:
            if not isinstance(value, str):
                error_count += 1

        # str, anything
        elif "measurements-columns-method" == key:
            if not isinstance(value, str):
                error_count += 1

        # str, anything
        elif "measurements-columns-material" == key:
            if not isinstance(value, str):
                error_count += 1

        # str, (air, and what else?)
        elif "measurements-columns-climateInterpretation-parameterDetail" == key:
            if not isinstance(value, str):
                error_count += 1
            # Check a specific list of what values parameter detail

        # str, ??
        elif "measurements-columns-climateInterpretation-parameter" == key:
            if not isinstance(value, str):
                error_count += 1

        # str, ??
        elif "measurements-columns-climateInterpretation-seasonality" == key:

            # Have a way to check a season, months, range of months, etc.

            # if value not in (months and months_num):
                # error_count += 1
            if not isinstance(value, str):
                error_count += 1

        # str
        elif "measurements-columns-climateInterpretation-basis" == key:
            if not isinstance(value, str):
                error_count += 1

        # str
        elif "measurements-columns-climateInterpretation-interpDirection" == key:
            if not isinstance(value, str):
                error_count += 1

    return error_count

# Main method
def run():
    file = 'test_flat2.json'
    flat_json = open(file)
    data = json.load(flat_json)
    print(validation(data))
    return

run()
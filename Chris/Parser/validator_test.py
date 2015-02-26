import json
import re


# All path items are automatically strings. If you think it's an int or float, use this to attempt to convert it.
# Accepts: str
# Returns: int or float
def convert_num(number):
    try:
        return int(number)
    except ValueError:
        return float(number)


# Take in the string of the attr. path, and split it into a list
# Accept: str
# Return: list
def path_str_split(str_path):
    return re.split(r'[-:]*', str_path)


# Deeper check for column attr's and such (low level)
# Accept: str
# Return: bool
def second_pass(str_path):
    return


# Simple check to see if the given item is the right type. True if valid, False if invalid
# Accepts: str
# Returns: bool
def first_pass(str_path):

    valid = False
    path_list = path_str_split(str_path)
    key = path_list[len(path_list)-2]
    value = path_list[len(path_list)-1]

    if '@context' in path_list:
        if isinstance(value, str):
            valid = True

    elif 'siteName' in path_list:
        if isinstance(value, str):
            valid = True

    elif 'comments' in path_list:
        if isinstance(value, str):
            valid = True

    elif 'collectionName' in path_list:
        if isinstance(value, str):
            valid = True

    elif 'geo' in path_list:
        if 'units' in path_list:
            if isinstance(value, str):
                valid = True

        else:
            convert = convert_num(value)
            if 'max' in path_list:
                if isinstance(convert, float) or isinstance(convert, int):
                    valid = True

            elif 'min' in path_list:
                if isinstance(convert, float) or isinstance(convert, int):
                    valid = True

            elif 'value' in path_list:
                convert = convert_num(value)
                if isinstance(convert, float) or isinstance(convert, int):
                    valid = True

    elif 'authors' in path_list:
        if isinstance(value, str):
            valid = True

    elif 'DOI' in path_list:
        if isinstance(value, str):
            valid = True

    elif 'year' in path_list:
        convert = convert_num(value)
        if isinstance(convert, float) or isinstance(convert, int):
            valid = True

    elif 'measTableName' in path_list:
        if isinstance(value, str):
            valid = True

    elif 'filename' in path_list:
        if isinstance(value, str):
            valid = True

    elif 'column' in path_list:
        convert = convert_num(value)
        if isinstance(convert, float) or isinstance(convert, int):
            valid = True

    elif 'dataType' in path_list:
        if isinstance(value, str):
            valid = True

    elif 'shortName' in path_list:
        if isinstance(value, str):
            valid = True

    elif 'longName' in path_list:
        if isinstance(value, str):
            valid = True

    # Going to need context for units eventually
    elif 'units' in path_list:
        if isinstance(value, str):
            valid = True

    elif 'archive' in path_list:
        if isinstance(value, str):
            valid = True

    elif 'Note' in path_list:
        if isinstance(value, str):
            valid = True

    elif 'method' in path_list:
        if isinstance(value, str):
            valid = True

    elif 'material' in path_list:
        if isinstance(value, str):
            valid = True

    elif 'error' in path_list:
        convert = convert_num(value)
        if isinstance(convert, float) or isinstance(convert, int):
            valid = True

    elif 'climateInterpretation' in path_list:

        if 'seasonality' in path_list:
            if isinstance(value, str):
                valid = True

        elif 'interpDirection' in path_list:
            if isinstance(value, str):
                valid = True

        elif 'basis' in path_list:
            if isinstance(value, str):
                valid = True

        elif 'parameter' in path_list:
            if isinstance(value, str):
                valid = True

        elif 'parameterDetail' in path_list:
            if isinstance(value, str):
                valid = True

    # Throw to another function that does deeper validation
    if valid:
        pass

    # Show what items are invalid
    else:
        print('Invalid: {0} - {1}'.format(key, value))

    return valid


# Main method
def run():
    error_count = 0
    file = 'test_flat2.json'
    flat_json = open(file)
    data = json.load(flat_json)

    # Loop through each path in flat_json. If it returns false, that means there's an error. Update count.
    for item in data:
        if not first_pass(item):
            error_count += 1

    # Check whether to quit validation, or to go on to second validation
    # Print errors if found
    if error_count == 0:

        print("Simple Validation: Passed")
        for item in data:
            if not second_pass(item):
                error_count += 1

        if error_count == 0:
            print("Deep Validation: Passed")
        else:
            print("Deep Validation: {0} errors".format(error_count))
    else:
        print("Simple Validation: {0} errors".format(error_count))

    return

run()
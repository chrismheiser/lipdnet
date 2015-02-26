import json
import re

# TEST PUSH

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
def secondary_check():
    return

# Simple check to see if the given item is the right type. True if valid, False if invalid
# Accepts: str
# Returns: bool
def first_checks(str_path):

    path_list = path_str_split(str_path)
    last_item = path_list[len(path_list)-1]

    if last_item == '':
        return True

    elif '@context' in path_list:
        if isinstance(last_item, str):
            return True

    elif 'siteName' in path_list:
        if isinstance(last_item, str):
            return True

    elif 'comments' in path_list:
        if isinstance(last_item, str):
            return True

    elif 'collectionName' in path_list:
        if isinstance(last_item, str):
            return True

    elif 'geo' in path_list:
        if 'units' in path_list:
            if isinstance(last_item, str):
                return True

        else:
            convert = convert_num(last_item)
            if 'max' in path_list:
                if isinstance(convert, float) or isinstance(convert, int):
                    return True

            elif 'min' in path_list:
                if isinstance(convert, float) or isinstance(convert, int):
                    return True
            elif 'value' in path_list:
                convert = convert_num(last_item)
                if isinstance(convert, float) or isinstance(convert, int):
                    return True

    elif 'authors' in path_list:
        if isinstance(last_item, str):
            return True

    elif 'DOI' in path_list:
        if isinstance(last_item, str):
            return True

    elif 'year' in path_list:
        convert = convert_num(last_item)
        if isinstance(convert, float) or isinstance(convert, int):
            return True

    elif 'measTableName' in path_list:
        if isinstance(last_item, str):
            return True

    elif 'filename' in path_list:
        if isinstance(last_item, str):
            return True

    elif 'column' in path_list:
        convert = convert_num(last_item)
        if isinstance(convert, float) or isinstance(convert, int):
            return True

    elif 'dataType' in path_list:
        if isinstance(last_item, str):
            return True

    elif 'shortName' in path_list:
        if isinstance(last_item, str):
            return True

    elif 'longName' in path_list:
        if isinstance(last_item, str):
            return True

    # Going to need context for units eventually
    elif 'units' in path_list:
        if isinstance(last_item, str):
            return True

    elif 'archive' in path_list:
        if isinstance(last_item, str):
            return True

    elif 'Note' in path_list:
        if isinstance(last_item, str):
            return True

    elif 'method' in path_list:
        if isinstance(last_item, str):
            return True

    elif 'material' in path_list:
        if isinstance(last_item, str):
            return True

    elif 'climateInterpretation' in path_list:

        if 'seasonality' in path_list:
            if isinstance(last_item, str):
                return True

        elif 'interpDirection' in path_list:
            if isinstance(last_item, str):
                return True

        elif 'basis' in path_list:
            if isinstance(last_item, str):
                return True

        elif 'parameter' in path_list:
            if isinstance(last_item, str):
                return True

        elif 'parameterDetail' in path_list:
            if isinstance(last_item, str):
                return True

    print('\n')
    print(path_list[len(path_list)-2])
    print(last_item)
    print('\n')
    return False

# Main method
def run():
    error_count = 0
    file = 'test_flat.json'
    flat_json = open(file)
    data = json.load(flat_json)

    # Loop through each path in flat_json. If it returns false, that means there's an error. Update count.
    for item in data:
        if not first_checks(item):
            error_count += 1
    print("{0} errors found".format(error_count))
    return

run()
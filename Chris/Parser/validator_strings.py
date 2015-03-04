import json
import re

# TEST PUSH

# Lists of all valid values of each key

geo_units = ['decimalDegrees', 'M', 'm']
measurements_units = ['Year in AD', 'ratio compared to SMOW']
dataType = ['str', 'float']


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
                if last_item in geo_units:
                    return True
                else:
                    # Check if the unit they are looking for is in geo_units
                    geo_units_choice = input('Are the units you are looking for in ' + geo_units + '? (y/n) ')
                    if geo_units_choice == 'y' or geo_units_choice == 'Y':
                        new_last_item = input('Which unit would you like to replace ' + last_item + ' with? ')
                        last_item = new_last_item
                        return True

                    # If unit is not in geo_units, add new unit to the list for future list
                    elif geo_units_choice == 'n' or geo_units_choice == 'N':
                        add_question = input('Would you like to add a new unit or choose a previous unit? (add/choose')
                        if add_question == 'add':
                            unit_to_add = input('What would you like to add? ')
                            geo_units.append(unit_to_add)
                            last_item = unit_to_add
                            return True

                        elif add_question == 'choose':
                            new_last_item = input('Which unit would you like? ' + geo_units)
                            last_item = new_last_item

                        else:
                            print('That is not a valid input, "add" or "choose" are the only valid choices.')

                    else:
                        print('That is not a valid input, "y" or "n" are the only valid choices.')



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

    # Will always have different values, just check if it's a string
    elif 'authors' in path_list:
        if isinstance(last_item, str):
            return True

    # Will always have different values, just check if it's a string
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
            if last_item in dataType:
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
            else:
                    # Check if the data type they are looking for is in dataType
                    dataType_choice = input('Is the data type you are looking for in ' + dataType + '? (y/n) ')
                    if dataType_choice == 'y' or dataType_choice == 'Y':
                        new_last_item = input('Which data type would you like to replace ' + last_item + ' with? ')
                        last_item = new_last_item
                        return True

                    # If unit is not in geo_units, add new unit to the list for future list
                    elif dataType_choice == 'n' or dataType_choice == 'N':
                        add_question = input('Would you like to add a new data type or choose one? (add/choose)')
                        if add_question == 'add':
                            unit_to_add = input('What would you like to add? ')
                            dataType.append(unit_to_add)
                            last_item = unit_to_add
                            return True

                        elif add_question == 'choose':
                            new_last_item = input('Which unit would you like? ' + dataType)
                            last_item = new_last_item

                        else:
                            print('That is not a valid input, "add" or "choose" are the only valid choices.')

                    else:
                        print('That is not a valid input, "y" or "n" are the only valid choices.')

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
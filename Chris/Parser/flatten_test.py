__author__ = 'chrisheiser1'
import json

"""
This flattener is specifically for testing with a hard-coded file path for the test file.
Specifically use this to make sure the flattener will work with different cases before integrating it into the parser.

"""

"""
Current problem: The lists in YEAR and DOI are not not being added and cleared

It's not working because there is no case to handle when a list has raw data in it (i.e. no dicts, no lists, no nesting)
These two items contain only single strings and integers.

"""

#
def check_bottom(dict_in):
    ## Temp variables
    bottom = False
    items = len(dict_in)

    ## Count how many of the entries have String values
    if type_check(dict_in) == 'dict':
        count = count_strings_dict(dict_in)
    elif type_check(dict_in) == 'list':
        count = count_strings_list(dict_in)
    else:
        count = 0

    ## If there are equal number of string values and items in the dictionary, then there's no more nesting.
    ## Meaning we are at the bottom of the path
    if count == items:
        bottom = True

    return bottom


def count_strings_list(list_in):
    count = 0
    for i in range(0, len(list_in)):
        if isinstance(list_in[i], str):
            count += 1
    return count


# Check if all the entries in V are strings
def count_strings_dict(dict_in):
    count = 0
    for k, v in dict_in.items():
        if type_check(v) == 'str':
            count += 1
        elif type_check(v) == 'list':
            for i in range(0, len(v)):
                if type_check(v[i]) == 'str':
                    count += 1
    return count


# Remove all the empty strings from the final list
# Accepts: list
# Returns: list
def remove_empty_items(list_in):
    i = 0
    while i < len(list_in):
        if list_in[i] == "":
            list_in.remove("")
        i += 1
    return list_in


# Take the path list, and turn it into a path string
def to_string(list_in):
    ## We need to distinguish the key-value pair. If there is a longer path, put hyphens between each level
    if len(list_in) > 2:
        end = len(list_in) - 2
        path = list_in[:end]
        k_v = list_in[end:]
        path_join = '-'.join(map(str, path))
        k_v_join = ':'.join(map(str, k_v))
        return path_join + '-' + k_v_join
    return ':'.join(map(str, list_in))


# Check what type of item we have
def type_check(item):
    if isinstance(item, str) or isinstance(item, float) or isinstance(item, int):
        return 'str'
    elif isinstance(item, list):
        return 'list'
    elif isinstance(item, dict):
        return 'dict'
    else:
        print('type error')
        return


# ACCEPTS: dictionary(dict), current path (list), overall path (list)
# RETURNS: None
def append_one_item(v, current, overall):
    current.append(v)
    temp = to_string(current)
    overall.append(temp)
    current.remove(v)
    return


# If the item we have is a dead end, add the key-value to the current path
# Then, convert the path to a string, and add to the overall list of paths
# Then remove the key-value to preserve the current path.
# ACCEPTS: key(k), value(v), current path (list), overall path (list)
# RETURNS: None
def append_two_items(k, v, current, overall):
    current.append(k)
    current.append(v)
    temp = to_string(current)
    overall.append(temp)
    current.remove(v)
    current.remove(k)
    return


# ACCEPT: dictionary (dict), current path (list), overall path (list)
# RETURNS: overall path (list)
def dive(dict_in, current, overall):
    # Start by checking if the item is a dict
    # It always should be a dictionary, but if not have a way to handle it
    if type_check(dict_in) == 'dict':

        bottom = check_bottom(dict_in)

        # If we're at the bottom, remember to clear the current path list at the end
        if bottom:

            # ONE EXCEPTION TO BEING AT THE BOTTOM
            # If we are on the bottom AND in the ClimateInterp section, we need to remove "climateInterpretation"
            # from the current path after we're done, or it'll ruin the paths for the remaining measurement columns
            if (len(current) != 0) and (current[len(current) - 1] == 'climateInterpretation'):
                for k, v in dict_in.items():
                    append_two_items(k, v, current, overall)

                # Pop 'climateInterpretation' from our current path list
                current.pop()

            # If we're at the bottom for any other case, we can clear the whole current path
            else:
                for k, v in dict_in.items():
                    append_two_items(k, v, current, overall)
                overall.append('')
                current.clear()

        # If we are not at the bottom, then add whatever current paths you can, and then make another dive
        else:
            for k, v in dict_in.items():
                if type_check(v) == 'str':
                    append_two_items(k, v, current, overall)

            for k, v in dict_in.items():
                if type_check(v) == 'dict':
                    current.append(k)
                    dive(v, current, overall)

            for k, v in dict_in.items():
                if type_check(v) == 'list':
                    current.append(k)

                    # PROBLEM HERE
                    # Doing a bottom check for any lists that only have raw data
                    list_bottom = check_bottom(v)
                    if list_bottom:
                        for item in range(0, len(v)):
                            append_one_item(v[item], current, overall)
                        current.clear()

                    else:
                        for item in range(0, len(v)):
                            # Appending a space for readability purposes
                            overall.append('')
                            dive(v[item], current, overall)

    return overall


def run():
    current = []
    overall = []
    json_path = 'test2.jsonld'
    json_data = open(json_path)
    data = json.load(json_data)
    final = dive(data, current, overall)
    for i in final:
        print(i)
    json_data.close()


run()
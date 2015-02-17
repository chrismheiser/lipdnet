__author__ = 'chrisheiser1'
import json

"""
The flattener takes in the final dictionary (JSON LD) from the parser, flattens it, and then returns the
new flattened structure back to the parser.

"""

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

    # We need to distinguish the key-value pair. If there is a longer path, put hyphens between each level
    if len(list_in) > 2:
        end = len(list_in)-2
        path = list_in[:end]
        k_v = list_in[end:]
        path_join = '-'.join(map(str, path))
        k_v_join = ':'.join(map(str,k_v))
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
# RETURNS: None (the items we want are appended to the lists, don't need to return anything)
# If the item we have is a dead end, add the key-value to the current path
# Then, convert the path to a string, and add to the overall list of paths
# Then remove the key-value to preserve the current path.
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
    if type_check(dict_in) is 'dict':

        # Temp variables
        bottom = False
        count = 0
        items = len(dict_in)

        # Count how many of the entries have String values
        for k, v in dict_in.items():
            if type_check(v) is 'str':
                count += 1

        # If there are equal number of string values and items in the dictionary, then there's no more nesting.
        # Meaning we are at the bottom of the path
        if count == items:
            bottom = True

        # If we're at the bottom, remember to clear the current path list at the end
        if bottom:

            # ONE EXCEPTION TO BEING ON THE BOTTOM
            # If we are on the bottom AND in the ClimateInterp section, we need to remove "climateInterpretation"
            # from the current path after we're done, or it'll ruin the paths for the remaining measurement columns
            if (len(current) != 0) and (current[len(current)-1] == 'climateInterpretation'):
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
                if type_check(v) is 'str':
                    append_two_items(k, v, current, overall)

            for k, v in dict_in.items():
                if type_check(v) is 'dict':
                    current.append(k)
                    dive(v, current, overall)

            for k, v in dict_in.items():
                if type_check(v) is 'list':
                    current.append(k)
                    for item in range(0, len(v)):
                        overall.append('')
                        dive(v[item], current, overall)

    overall = remove_empty_items(overall)
    return overall

def run(final_dict):
    current = []
    overall = []
    json_data = open(final_dict)
    final = dive(final_dict, current, overall)
    json_data.close()
    return final


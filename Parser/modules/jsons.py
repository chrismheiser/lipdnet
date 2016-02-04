import json

import demjson

EMPTY = ['', ' ', None, 'na', 'n/a', 'nan', '?']


def write_json_to_file(filename, json_data):
    """
    Write all JSON in python dictionary to a new json file.
    :param filename: (str) Target File
    :param json_data: (dict) JSON data
    :return: None
    """
    # Use demjson to maintain unicode characters in output
    json_bin = demjson.encode(json_data, encoding='utf-8', compactly=False)
    # Write json to file
    open(filename, "wb").write(json_bin)
    return


def read_json_from_file(filename):
    """
    Import the JSON data from target file.
    :param filename: (str) Target Files
    :return: (dict) JSON data
    """
    d = {}
    try:
        # Open json file and read in the contents. Execute DOI Resolver?
        with open(filename, 'r') as f:
            # Load json into dictionary
            d = demjson.decode(json.load(f))
    except FileNotFoundError:
        print("LiPD object: Load(). file not found")
    return d


def remove_csv_from_json(d):
    """
    Remove all CSV data 'values' entries from paleoData table in the JSON structure.
    :param d: (dict) JSON data
    :return: (dict) Metadata dictionary without CSV values
    """
    d = {}
    # Loop through each table in paleoData
    for table in d['paleoData']:
        for col in table['columns']:
            try:
                # try to delete the values key entry
                del col['values']
            except KeyError:
                # if the key doesn't exist, keep going
                print("RemoveCSVfromJSON: Error deleting values")
    return d


def remove_empties(d):
    """
    Go through N number of nested data types and remove all empty entries. Recursion
    :param d: (any) Dictionary, List, or String of data
    :return: (any) Returns a same data type as original, but without empties.
    """
    # Int types don't matter. Return as-is.
    if not isinstance(d, int):
        if isinstance(d, str) or d is None:
            try:
                # Remove new line characters and carriage returns
                d = d.rstrip()
            except AttributeError:
                # None types don't matter. Keep going.
                pass
            if d in EMPTY:
                # Substitute empty entries with ""
                d = ''
        elif isinstance(d, list):
            # Recurse once for each item in the list
            for i, v in enumerate(d):
                d[i] = remove_empties(d[i])
            # After substitutions, remove and empty entries.
            for i in d:
                if not i:
                    d.remove(i)
        elif isinstance(d, dict):
            # First, go through and substitute "" (empty string) entry for any values in EMPTY
            for k, v in d.items():
                d[k] = remove_empties(v)
            # After substitutions, go through and delete the key-value pair.
            # This has to be done after we come back up from recursion because we cannot pass keys down.
            for key in list(d.keys()):
                if not d[key]:
                    del d[key]

    return d
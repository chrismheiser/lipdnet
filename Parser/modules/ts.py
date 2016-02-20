from copy import deepcopy
from Parser.time_series.TimeSeriesLibrary import *
from Parser.time_series.TimeSeries import *


def extract_tso_from_json(d):
    """
    The main function for creating a TSO from json.
    :param d:
    :return:
    """
    flat = {}
    # Create a "base" of static data. This will serve as the template for which
    # column data will be added onto later.
    for k, v in d.items():
        if isinstance(v, str):
            flat[k] = v
        elif k == "funding":
            flat = extract_funding(v, flat)
        elif k == "geo":
            flat = extract_geo(v, flat)
        elif k == 'pub':
            flat = extract_pub(v, flat)

    # Create and add TimeSeriesObjects to the TimeSeriesLibrary
    return extract_paleo(d, flat)


def extract_funding(l, target):
    """
    Creates flat funding dictionary.
    :param l: (list) Funding entries
    :return: (d) Flat dictionary
    """
    for idx, i in enumerate(l):
        for k, v in i.items():
            target['funding' + str(idx+1) + '_' + k] = v
    return target


def extract_geo(d, target):
    """

    :param d:
    :param target:
    :return:
    """
    # May not need these if the key names are corrected in the future.
    x = ['geo_meanLat', 'geo_meanLon', 'geo_meanElev']
    # Iterate through geo dictionary
    for k, v in d.items():
        # Case 1: Coordinates special naming
        if k == 'coordinates':
            for idx, i in enumerate(v):
                try:
                    target[x[idx]] = i
                except IndexError:
                    continue
        # Case 2: Any value that is a string can be added as-is
        elif isinstance(v, str):
            target['geo_' + k] = v
        # Case 3: Nested dictionary. Recursion downward
        elif isinstance(v, dict):
            extract_geo(v, target)
    # Return flat dictionary of geo items
    return target


def extract_pub(l, target):
    """
    Extract publication data from one or more publication entries.
    :param l:
    :param target:
    :return:
    """
    # For each publication entry
    for idx, pub in enumerate(l):
        # Get author data first, since that's the most ambiguously structured data.
        target = extract_authors(pub, target, idx)

        # Go through data of this publication
        for k, v in pub.items():
            # Case 1: DOI ID. Don't need the rest of 'identifier' dict
            if k == 'identifier':
                try:
                    target['pub' + str(idx+1) + '_DOI'] = v[0]['id']
                except KeyError:
                    continue
            # Case 2: All other string entries
            else:
                if k != ('authors' or "author"):
                    target['pub' + str(idx+1) + '_' + k] = v

    # Return flat dictionary of publication data
    return target


def extract_authors(pub, target, idx):
    """
    Create a concatenated string of author names. Separate names with semi-colons.
    :param pub: (unknown type) Publication author structure is ambiguous
    :param target: (dict) Target dictionary
    :return: (dict) Modified target dictionary
    """
    # Check for "author" field first. This is typically DOI response data.
    try:
        names = pub['author']
    except KeyError:
        try:
            names = pub['authors']
        except KeyError:
            names = False

    # If there is author data, find out what type it is
    if names:
        # Build author names onto empty string
        auth = ''
        # Is it a list of dicts or a list of strings? Could be either
        # Authors: Stored as a list of dictionaries or list of strings
        if isinstance(names, list):
            if len(names) > 1:
                for name in names:
                    if isinstance(name, str):
                        auth += name
                    elif isinstance(name, dict):
                        for k, v in name.items():
                            auth += v + ';'
        elif isinstance(names, str):
            auth = names
        # Enter finished author string into target
        target['pub' + str(idx+1) + '_author'] = auth[:-1]
    return target


def extract_paleo(d, target):
    """
    Extract all data from a paleoData table.
    :param d:
    :param target:
    :return:
    """
    d2 = {}
    # For each table in paleoData
    for k, v in d['paleoData'].items():
        # Get root items for this table
        table = extract_paleo_table_root(v, target)
        # Start creating TSOs with dictionary copies.
        for i, e in v['columns'].items():
            # TSO. Add this column onto root items. Deepcopy since we'll do this to many unique columns
            col = extract_paleo_columns(e, deepcopy(table))
            # Add this TSO to the final output dictionary.
            # d2[d['dataSetName'] + '_' + k + '_' + i] = create_tso(col)
            d2[d['dataSetName'] + '_' + k + '_' + i] = col
    # This dictionary will be processed to create one TSO for each entry.
    return d2


def extract_paleo_table_root(d, target):
    """
    Extract data from the root level of a paleoData table.
    :param d:
    :param target:
    :return:
    """
    for k, v in d.items():
        if isinstance(v, str):
            target['paleoData_' + k] = v
    return target


def extract_paleo_columns(d, target):
    """
    Extract data from one paleoData column
    :param d:
    :param target:
    :return:
    """
    for k, v in d.items():
        if k == 'climateInterpretation':
            target = extract_climate_interpretation(v, target)
        elif k == 'calibration':
            target = extract_calibration(v, target)
        else:
            # Assume if it's not a special nested case, then it's a string value
            target['paleoData_' + k] = v
    return target


def extract_calibration(d, target):
    """
    Get calibration info from column data.
    :param d:
    :param target:
    :return:
    """
    for k, v in d.items():
        target['calibration_' + k] = v
    return target


def extract_climate_interpretation(d, target):
    """
    Get climate interpretation from column data.
    :param d:
    :param target:
    :return:
    """
    for k, v in d.items():
        target['climateInterpretation_' + k] = v
    return target


def create_tso(d):
    """
    Creates a TimeSeriesObject and add it to the TimeSeriesLibrary
    :param d:
    :return:
    """
    return TimeSeries().load(d)


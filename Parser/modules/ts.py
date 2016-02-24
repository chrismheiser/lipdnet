from copy import deepcopy
import csv
import os.path
import time

from Parser.time_series.TimeSeriesLibrary import *
from Parser.time_series.TimeSeries import *
from Parser.modules.google import *

# LiPD to TIME SERIES

# GLOBALS
re_misc_fetch = re.compile(r'(geo_(\w+)|climateInterpretation_(\w+)|calibration_(\w+)|paleoData_(\w+))')
fetch = re.compile(r'pub1_(citation|year|DOI|author|publisher|title|type|volume|issue|journal|link|pubDataUrl|abstract|pages)')

re_pub_valid = re.compile(r'pub(\d)_(citation|year|DOI|author|publisher|title|type|volume|issue|journal|link|pubDataUrl|abstract|pages)')
re_fund_valid = re.compile(r'funding(\d)_(grant|agency)')

re_pub_invalid = re.compile(r'pub_(\w+)|pub(\d)_(\w+)|pub(\d)(\w+)|pub(\w+)')
re_fund_invalid = re.compile(r'agency|grant|funding_agency|funding_grant')
re_geo_invalid = re.compile(r'geo(\w+)|geo_(\w+)')
re_paleo_invalid = re.compile(r'paleodata(\w+)|paleodata_(\w+)|measurement(\w+)|measurement_(\w+)')
re_calib_invalid = re.compile(r'calibration(\w+)|calibration_(\w+)')
re_clim_invalid = re.compile(r'climateinterpretation(\w+)|climateinterpretation_(\w+)')

re_pub_nh = re.compile(r'pub(\d)_(\w+)')
re_pub_cc = re.compile(r'pub(\w+)')
re_pub_h = re.compile(r'pub_(\w+)')
re_pub_n = re.compile(r'pub(\d)(\w+)')


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
    :param target: (dict) Target dictionary
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
                    target[x[idx]] = float(i)
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
    :param idx: (int) Index number
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


# TIME SERIES to LiPD

# Helper Functions


def create_tso(d):
    """
    Creates a TimeSeriesObject and add it to the TimeSeriesLibrary
    :param d: (dict) Time Series dictionary
    :return: (obj) Time Series Object
    """
    return TimeSeries().load(d)


def get_valid_tsname(invalid, full_list):
    """
    Turn a bad tsname into a valid one.
    * Note: Index[0] for each TSName is the most current, valid entry. Index[1:] are synonyms
    :param invalid: (str) Invalid tsname
    :param full_list: (dict) Keys: valid tsnames Values: synonyms
    :return: (str) valid tsname
    """
    valid = ''
    invalid = invalid.lower()
    try:
        # PUB ENTRIES
        if re_pub_invalid.match(invalid):

            # Case 1: pub1_year (number and hyphen)
            if re_pub_nh.match(invalid):
                s_invalid = invalid.split('_', 1)
                # Check which list the key word is in
                for line in full_list['pub']:
                    for key in line:
                        if s_invalid[1] in key.lower():
                            # Get the keyword from the valid entry.
                            v = line[0].split("_")
                            # Join our category with the valid keyword
                            valid = ''.join([s_invalid[0], '_', v[1]])

            # Case 2: pub_year (hyphen)
            elif re_pub_h.match(invalid):
                s_invalid = invalid.split('_', 1)
                # The missing pub number is the main problem, but the keyword may or may not be correct. Check.
                for line in full_list['pub']:
                    for key in line:
                        if s_invalid[1] in key.lower():
                            # We're going to use the valid entry as-is, because that's what we need for this case.
                            valid = line[0]

            # Case 3: pub1year (number)
            elif re_pub_n.match(invalid):
                s_invalid = re_pub_n.match(invalid)
                for line in full_list['pub']:
                    for key in line:
                        if s_invalid.group(2) in key.lower():
                            v = line[0].split('_', 1)
                            valid = ''.join(['pub', s_invalid.group(0), v[1]])

            # Case 4: pubYear (camelcase)
            elif re_pub_cc.match(invalid):
                valid = iter_ts(full_list['pub'], invalid)

        # FUNDING
        elif re_fund_invalid.match(invalid):
            if "grant" in invalid:
                valid = 'funding1_grant'
            elif "agency" in invalid:
                valid = "funding1_agency"

        # GEO
        elif re_geo_invalid.match(invalid):
            valid = iter_ts(full_list['geo'], invalid)

        # PALEODATA
        elif re_paleo_invalid.match(invalid):
            g1 = re_paleo_invalid.match(invalid).group(1)
            valid = iter_ts(full_list['paleoData'], g1)

        # CALIBRATION
        elif re_calib_invalid.match(invalid):
            g1 = re_calib_invalid.match(invalid).group(1)
            valid = iter_ts(full_list['calibration'], g1)

        # CLIMATE INTERPRETATION
        elif re_clim_invalid.match(invalid):
            g1 = re_clim_invalid.match(invalid).group(1)
            if 'climate' in g1:
                g1 = re.sub('climate', '', g1)
            valid = iter_ts(full_list['climateInterpretation'], g1)

        else:
            # ROOT
            valid = iter_ts(full_list['root'], invalid)

        # If all else fails, it's probably a specific case that isn't a typical format. Or there isn't a match.
        # Go through all possible entries to see if it matches.
        if not valid:
            valid = iter_ts(full_list, invalid)

    except IndexError:
        print("Get TSName: Something went wrong")
    if not valid:
        print("TSName: Couldn't find a match: " + invalid)
    return valid


def iter_ts(x, invalid):
    """
    Match an invalid entry to one of the TSName synonyms.
    :param x: (dict) Full TSnames OR (list) one specific category
    :param invalid: (str) Invalid tsname string
    :return: (str) Valid tsname
    """
    valid = ''

    # If a leading hyphen is in the string, get rid of it.
    if '_' == invalid[0]:
        invalid = invalid[1:]

    # If one specific category is passed through
    if isinstance(x, list):
        for line in x:
            for key in line:
                if invalid in key.lower():
                    valid = line[0]
                    break
    # If the entire TSNames dict is passed through (i.e. final effort, all categories have failed so far)
    elif isinstance(x, dict):
        for k, v in x.items():
            for line in v:
                for key in line:
                    if invalid in key.lower():
                        valid = line[0]
                        break

    return valid


def fetch_tsnames():
    """
    Call down a current version of the TSNames spreadsheet from google. Convert to a structure better for comparisons.
    :return: (d) Keys: Valid TSName, Values: TSName synonyms
    :return: (valid) List of valid TSnames
    """

    d = {"root": [], "pub": [], "climateInterpretation": [],
     "calibration": [], "geo": [], "paleoData": []}
    valid = []

    # Check if it's been longer than one day since updating the TSNames.csv file.
    # If so, go fetch the file from google in case it's been updated since.
    if check_file_age('tsnames.csv', 1):
        # Fetch TSNames sheet from google
        print("TSNames is more than one day old. Fetching update...")
        ts_id = '1C135kP-SRRGO331v9d8fqJfa3ydmkG2QQ5tiXEHj5us'
        get_google_csv(ts_id, 'tsnames.csv')
    try:
        # Start sorting the tsnames into an organized structure
        with open('tsnames.csv', 'r') as f:
            r = csv.reader(f, delimiter=',')
            for idx, line in enumerate(r):
                # print('line[{}] = {}'.format(i, line))
                if idx != 0:
                    # Do not record empty lines. Create list of non-empty entries.
                    line = [x for x in line if x]
                    # If line has content (i.e. not an empty line), then record it
                    if line:
                        # We don't need all the duplicates of pub and fund.
                        if "pub" in line[0] or "funding" in line[0]:
                            if fetch.match(line[0]):
                                valid.append(line[0])
                                d['pub'].append(line)
                            # Don't really care about funding too much. Easy to match.
                            # elif re_fund_keep.match(line[0]):
                            #     valid.append(line[0])
                            #     d['funding'].append(line)
                        elif re_misc_fetch.match(line[0]):
                            # Other Categories. Not special
                            valid.append(line[0])
                            cat, key = line[0].split('_')
                            d[cat].append(line)
                        else:
                            # Any of the root items
                            valid.append(line[0])
                            d["root"].append(line)
    except FileNotFoundError:
        print("CSV FileNotFound: TSNames")

    return d, valid


def verify_tsnames(d, full_list, quick_list, recent):
    """
    Verify TSNames are current and valid. Compare to TSNames spreadsheet in Google Drive. Update where necessary.
    :param d:(dict) TimeSeries to be verified
    :param full_list: (dict) Valid TSNames and synonyms
    :param quick_list: (list) Quick list of valid TSNames, no synonyms
    :param recent: (dict) Recent keys that were converted. Key: bad tsname, Value: correct tsname.
    :return: (d) Validated TimeSeries
    """
    temp = []

    # Build onto the "recent" dictionary so we have a list of keys to replace.
    for k, v in d.items():
        # paleoData_filename and @context need to be added to TSNames master list or Ignored
        if k not in quick_list and not re_pub_valid.match(k) and not re_fund_valid.match(k) and k != '@context' and k != 'paleoData_filename':
            # Invalid key. Store in temp for processing.
            if k not in recent:
                temp.append(k)
    # Start to find replacements for empty entries in "recent"
    for incorrect in temp:
        # Set incorrect name as key, and valid name as value.
        recent[incorrect] = get_valid_tsname(incorrect, full_list)

    # Use temp to start replacing entries in d
    for invalid, valid in recent.items():
        try:
            d[valid] = d.pop(invalid)
        except KeyError:
            continue

    return d, recent


def check_file_age(filename, days):
    """
    Check if the target file has an older creation date than X amount of time.
    i.e. One day: 60*60*24
    :param filename: (str) Target filename
    :param days: (int) Limit in number of days
    :return: (bool) True - older than X time, False - not older than X time
    """
    t = days * 60 * 60 * 24
    now = time.time()
    specified_time = now - t
    if os.path.getctime(filename) < specified_time:
        return True
    return False

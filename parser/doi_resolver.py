__author__ = 'Chris Heiser, Austin McDowell'

"""
PURPOSE: Runs as a subprocess to the main parser. Use DOI ID to pull updated publication info from doi.org and overwrite file data.

CHANGELOG
Version 1.2 / Dec 6, 2015 / Chris
Version 1.1 / July 5, 2015 / Chris
Version 1.0 / June 9, 2015 / Austin

Input:  pub dictionary
Output: pub dictionary

"""

from urllib.parse import urlparse
from collections import OrderedDict
import json
import requests
import calendar
import os
import re


class DOIResolver(object):

    def __init__(self):
        self = self

    """
    Returns DOI ID reference (i.e. 10.1029/2005pa001215)
    """
    def clean(self, doi_string):

        regex = re.compile(r'\b(10[.][0-9]{3,}(?:[.][0-9]+)*/(?:(?!["&\'<>])\S)+)\b')
        # Returns a list of matching strings
        try:
            m = re.findall(regex, doi_string)
        # If doi_string is None type, catch error
        except TypeError:
            m = []
        print(m)
        return m

    def quarantine(self, pub_dict, doi_string, name):
        # Create a text file
        #
        return

    def noaa_citation(self, root_dict, doi_string):
        # Append location 1
        if 'link' in root_dict['pub'][0]:
            root_dict['pub'][0]['link'].append({"url": doi_string})
        else:
            root_dict['pub'][0]['link'] = [{"url": doi_string}]

        # Append location 2
        root_dict['dataURL'] = doi_string

        return


    """
    DOI string did not match the regex. Determine what the data is.
    """
    def illegal_doi(self, root_dict, doi_string, name):
        # empty DOI string, check if length of string less than 5
        # ignore and return original dict as-is
        # if len(doi_string) < 5:
        #     pass

        # NOAA string
        if 'noaa' in doi_string.lower():
            self.noaa_citation(root_dict, doi_string)

        # Paragraph citation / Manual citation
        elif doi_string.count(' ') > 3:
            root_dict['pub'][0]['citation'] = doi_string

        # Strange Links or Other, send to quarantine
        else:
            self.dev_logger_txt("quarantine.txt", name, "Unexpected DOI String: " + doi_string)

        return

    """
    Compiles date only using the year
    """
    def compile_date(self, date_parts):
        if date_parts[0][0]:
            return date_parts[0][0]
        return 'NaN'

    """
    Compiles date [year, month, day] into "30 Jul 2015" format
    """
    def compile_date_old(self, date_parts):
        out = []
        for date in date_parts:
            if len(date) == 3:
                out.append(str(date[2]) + ' ' + str(calendar.month_name[date[1]]) + ' ' + str(date[0]))
            elif len(date) == 2:
                out.append(str(calendar.month_name[date[1]]) + ' ' + str(date[0]))
            else:
                out.append(date[0])

        return out

    """
    Compiles authors "Last, First" into a single list
    """
    def compile_authors(self, authors):
        out = []
        for person in authors:
            out.append({'name': person['family'] + ", " + person['given']})
        return out

    """
    Take in our Original Pub, and Fetched Pub. For each Fetched entry that has data, overwrite the Original entry.
    """
    def compare_replace(self, pub_dict, fetch_dict):
        blank = [" ", "", None]

        for k, v in fetch_dict.items():
            try:
                if fetch_dict[k] != blank:
                    pub_dict[k] = fetch_dict[k]

            except KeyError:
                pass

        return pub_dict

    """
    Loop over Raw and add selected items to Fetch with proper formatting
    """
    def compile_fetch(self, raw, doi_id):
        fetch_dict = OrderedDict()
        order = {'author': 'author', 'type': 'type', 'identifier': '', 'title': 'title', 'journal': 'container-title',
                'pubYear': '', 'volume': 'volume', 'publisher': 'publisher', 'page':'page', 'issue': 'issue'}

        for k, v in order.items():
            try:
                if k == 'identifier':
                    fetch_dict[k] = [{"type": "doi", "id": doi_id, "url": "http://dx.doi.org/" + doi_id}]
                elif k == 'author':
                    fetch_dict[k] = self.compile_authors(raw[v])
                elif k == 'pubYear':
                    fetch_dict[k] = self.compile_date(raw['issued']['date-parts'])
                else:
                    fetch_dict[k] = raw[v]
            except KeyError as e:
                # If we try to add a key that doesn't exist in the raw dict, then just keep going.
                pass

        return fetch_dict

    """
    Resolve DOI and compile all attibutes into one dictionary
    """
    def get_data(self, name, pub_dict, doi_id):

        try:
            # Send request to grab metadata at URL
            url = "http://dx.doi.org/" + doi_id
            headers = {"accept": "application/rdf+xml;q=0.5, application/citeproc+json;q=1.0"}
            r = requests.get(url, headers=headers)
            raw = json.loads(r.text)

            # DOI server error or empty raw dictionary, return the original pub. No new data retreived
            if r.status_code != 200 or not raw:
                return pub_dict

            # Create a new pub dictionary with metadata received
            fetch_dict = self.compile_fetch(raw, doi_id)

            # Compare the two pubs. Overwrite old data with new data where applicable
            pub_dict = self.compare_replace(pub_dict, fetch_dict)
            pub_dict['PubDataUrl'] = 'doi.org'

        # Log DOI ids that were not able to fetch
        except:
            self.dev_logger_txt("quarantine.txt", name, "Unable to fetch with DOI: " + doi_id)

        return pub_dict

    """
    Debug Log. Log names and error of problematic files to a txt file
    """
    def dev_logger_txt(self, txt_file, name, info):
        org = os.getcwd()
        os.chdir('/Users/chrisheiser1/Desktop/')
        with open(txt_file, 'a+') as f:
            # write update line
            try:
                f.write("File: " + name + "\n" + "Error: " + info + "\n\n")
            except KeyError:
                print("Debug Log Error")
        os.chdir(org)
        return

    """
    Recursively search the file for the DOI id. More taxing, but more flexible when dictionary structuring isn't absolute
    """
    def find_doi(self, curr_dict):
        try:
            if 'id' in curr_dict:
                return curr_dict['id'], True
            elif isinstance(curr_dict, list):
                for i in curr_dict:
                    return self.find_doi(i)
            elif isinstance(curr_dict, dict):
                for k, v in curr_dict.items():
                    if k == 'identifier':
                        return self.find_doi(v)
                return curr_dict, False
            else:
                return curr_dict, False
        # If the ID key doesn't exist, then return the original dict with a flag
        except TypeError:
            return curr_dict, False

    """
    Main function that gets files, creates outputs, and runs all operations on files
    """
    def run(self, root_dict, name):

        # Retrieve DOI id key-value from the root_dict
        doi_string, doi_found = self.find_doi(root_dict['pub'])

        if doi_found:
            print("doi found")

            # Empty list for no match, or list of 1+ matching DOI id strings
            doi_list = self.clean(doi_string)

            if not doi_list:
                self.illegal_doi(root_dict, doi_string, name)

            else:
                for doi_id in doi_list:
                    root_dict['pub'].append(self.get_data(name, root_dict['pub'][0], doi_id))

        else:
            print("doi not found")
            # Quarantine the flagged file and log it
            self.dev_logger_txt("quarantine.txt", name, "No DOI id found")
            root_dict['pub'][0]['PubDataUrl'] = 'Manually Entered'

        return root_dict


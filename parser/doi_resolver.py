__author__ = 'Chris Heiser, Austin McDowell'

"""
PURPOSE: Runs as a subprocess to the main parser

CHANGELOG
Version 1.1 Tuesday, July 5, 2015 by Chris
Version 1.0 Tuesday, June 9, 2015 by Austin

Input:  pub dictionary

Output: pub dictionary

"""

from urllib.parse import urlparse
from collections import OrderedDict
import json
import requests
import calendar
import os
import zipfile

class DOIResolver(object):

    def __init__(self):
        self = self

    """
    Returns DOI ID reference (i.e. 10.1029/2005pa001215)
    """
    def clean(self, doi_id):
        doi_id = doi_id.replace(" ", "")
        if 'http' in doi_id:
            doi_id = urlparse(doi_id)[2]
        return doi_id

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
    Take in our Excel Pub, and Fetched Pub. For each Fetched entry that has data, overwrite the Excel entry.
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
    def get_data(self, pub_dict, doi_id):

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
        out = self.compare_replace(pub_dict, fetch_dict)

        return out


    """
    Recursively search the file for the DOI id. More taxing, but more flexible when dictionary structuring isn't absolute
    """
    def find_doi(self, curr_dict):
        if 'id' in curr_dict:
            print(curr_dict['id'])
            return curr_dict['id']
        elif isinstance(curr_dict, list):
            for i in curr_dict:
                return self.find_doi(i)
        elif isinstance(curr_dict, dict):
            for k, v in curr_dict.items():
                if k == 'identifier':
                    return self.find_doi(v)

    """
    Main function that gets files, creates outputs, and runs all operations on files
    """
    def run(self, pub_dict):

        doi_id = self.find_doi(pub_dict['pub'])
        return self.get_data(pub_dict, doi_id)


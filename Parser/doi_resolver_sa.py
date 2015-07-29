__author__ = 'chrisheiser1'

"""
PURPOSE: Runs as a standalone process to retreive DOI information on LiPD files

CHANGELOG
Version 1.2 Wed, 07.22.15 by Chris
Version 1.1 Tues, 07.05.15 by Chris
Version 1.0 Tues, 07.09.15 by Austin

Input:  '.lipd' file

Output: '-doi.lipd' file that has populated 'pub' fields resolved from the DOI (if there is one) parsed from the
original .lipd file.

"""

from urllib.parse import urlparse
from collections import OrderedDict
import json
import requests
import calendar
import os

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
    Sometimes DOI is string, sometimes list, sometimes empty. This checks for all cases and returns list of DOI id's
    """
    def multi_doi(self, doi_id):
        empty = False
        doi_list = []

        if type(doi_id) is list:
            if not doi_id:
                empty = True
            else:
                doi_list = doi_id
        else:
            doi_list.append(doi_id)

        return empty, doi_list

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
        doi_id = self.compare_replace(pub_dict, fetch_dict)

        return doi_id

    """
    Main function that gets files, creates outputs, and runs all operations on files
    """

    def run_standalone(self):

        # Choose the directory that has files. For debugging use only. Production will run script on current file.
        directory = '/Users/chrisheiser1/Desktop/doi/'
        os.chdir(directory)

        file_list = []
        pub_list = []

        # Delete any doi files that are in the dir. New update files will be created in their place.
        for file in os.listdir():
            if file.endswith('.jsonld'):
                if '-doi' in file:
                    os.remove(file)
                else:
                    file_list.append(file)

        # Run process on each file
        for txt in file_list:
            print(txt)
            # self.start = txt

            # Load data in JSON format
            json_data = open(txt)
            data = json.load(json_data)

            # Cut the extension from the file name
            name = os.path.splitext(txt)[0]

            if not os.path.exists('output/' + name):
                os.makedirs('output/' + name)

            # Create a new output text file
            file_out = open(directory + 'output/' + name + '/' + name +'-doi.lipd', 'w+')
            empty, doi_list = self.multi_doi(data['pub']['identifier']['id'])

            if not empty:
                for doi in doi_list:
                    # This may be a problem later on. What if we get two DOI id's but only get one pub_dict from excel?
                    # Or how do we know that there are any pub_dict's coming from excel?
                    output = self.get_data(data['pub'], self.clean(doi))
                    pub_list.append(output)
            data['pub'] = pub_list
            json.dump(data, file_out, indent=4)
            file_out.close()


# Use to create DOIResolver object and start running it.
c = DOIResolver()
c.run_standalone()

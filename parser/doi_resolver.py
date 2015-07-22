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
    Resolve DOI and compile all attibutes into one dictionary
    """
    def get_data(self, pub_dict, doi_id):

        # Send request to grab metadata at URL
        url = "http://dx.doi.org/" + doi_id
        headers = {"accept": "application/rdf+xml;q=0.5, application/citeproc+json;q=1.0"}
        r = requests.get(url, headers=headers)

        # DOI server error, return the original
        if r.status_code != 200:
            return pub_dict

        raw = json.loads(r.text)

        # If raw dictionary is empty, return the original
        if not raw:
            return pub_dict

        # # Check what items we fetched. Use to debug.

        # print(" EXCEL PUB _____________________")
        # for k, v in pub_dict.items():
        #     print('k: {0}, v:{1}'.format(k, v))
        #
        # print(" DOI PUB _____________________")
        # for k, v in raw.items():
        #     print('k: {0}, v:{1}'.format(k, v))

        # Create a new pub dictionary with metadata received
        fetch_dict = {}
        try:
            fetch_dict['author'] = self.compile_authors(raw['author'])
            fetch_dict['type'] = raw['type']
            fetch_dict['identifier'] = [{"type": "doi",
                                 "id": doi_id,
                                 "url": "http://dx.doi.org/" + doi_id}]
            fetch_dict['title'] = raw['title']
            fetch_dict['journal'] = raw['container-title']
            fetch_dict['pubYear'] = self.compile_date(raw['issued']['date-parts'])
            fetch_dict['volume'] = raw['volume']
            fetch_dict['publisher'] = raw['publisher']
            fetch_dict['page'] = raw['page']
            fetch_dict['issue'] = raw['issue']
        except KeyError as e:
            print("Key Error : {0}".format(e))

        doi_id = self.compare_replace(pub_dict, fetch_dict)

        return doi_id

    """
    Main function that gets files, creates outputs, and runs all operations on files
    """
    def run(self, pub_dict):

        pub_dict['doi'] = self.clean(pub_dict['doi'])
        return self.get_data(pub_dict)


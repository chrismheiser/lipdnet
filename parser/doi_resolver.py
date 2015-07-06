__author__ = 'Chris Heiser, Austin McDowell'

"""
CHANGELOG
Version 1.1 Tuesday, July 5, 2015 by Chris
Version 1.0 Tuesday, June 9, 2015 by Austin

Input:  '.lipd' file

Output: '-doi.lipd' file that has populated 'pub' fields resolved from the DOI (if there is one) parsed from the
original .lipd file.

"""

from collections import OrderedDict
from os import listdir
from urllib.parse import urlparse
import json
import os
import re
import requests
import datetime
import calendar


class DOIResolver:

    def __init__(self):
        self.run()

    """
    Returns DOI ID reference (i.e. 10.1029/2005pa001215)
    """
    def clean(self, doi):
        if 'http' in doi:
            doi = urlparse(doi)[2]
        return doi

    def compile_pubyear(self, date_parts):
        out = []
        for date in date_parts:
            out.append(str(date[2]) + ' ' + str(calendar.month_name[date[1]]) + ' ' + str(date[0]))

        return out

    """
    Compiles authors "Last, First" into a single list
    """
    def compile_authors(self, authors):
        out = []
        for person in authors:
            out.append(person['family'] + ', ' + person['given'])
        return out

    """
    Resolve DOI and compile all attibutes into one dictionary
    """
    def get_data(self, doi):

        url = "http://dx.doi.org/" + doi

        # Grab Metadata
        headers = {"accept": "application/rdf+xml;q=0.5, application/citeproc+json;q=1.0"}
        r = requests.get(url, headers=headers)
        metadata = json.loads(r.text)
        for k, v in metadata.items():
            print(k, v)

        # populate the fields in 'pub' section of new jsonld file
        populate = OrderedDict()
        # No abstract field??
        populate['authors'] = self.compile_authors(metadata['author'])
        populate['title'] = metadata['title']
        populate['journal'] = metadata['container-title']
        populate['pubYear'] = self.compile_pubyear(metadata['issued']['date-parts'])
        populate['volume'] = metadata['volume']
        populate['publisher'] = metadata['publisher']
        populate['page'] = metadata['page']
        populate['DOI'] = doi
        populate['issue'] = metadata['issue']

        return populate

    def run(self):
        directory = '/Users/chrisheiser1/Desktop/todoi/'
        file_list = []

        # Change directory to wherever our .lipd files are. In production, this will piggyback on current directory
        os.chdir(directory)

        # Delete any doi files that are in the dir. Update files will be made in their place.
        for file in os.listdir():
            if file.endswith('.lipd'):
                # Don't want to run existing doi files again
                if '-doi' in file:
                    os.remove(file)
                else:
                    file_list.append(file)

        # check to see which files are added to file_list
        print('file list: {0}'.format(file_list))

        # Run process on each file
        for txt in file_list:
            print(txt)
            self.start = txt

            # Load data in JSON format
            json_data = open(txt)
            data = json.load(json_data)

            # Cut the extension from the file name
            name = os.path.splitext(txt)[0]

            # Create a new output text file
            file_out = open(directory + name + '-doi.lipd', 'w+')

            try:
                doi = data['pub']['identifier']['id']
                # runs the program once files are created
                output = self.get_data(self.clean(doi))
                json.dump(output, file_out, indent=4)

            except IndexError:
                print("No ID field")

            file_out.close()

# sample doi: 'http://dx.doi.org/10.1029/2002PA000846'
DOIResolver()

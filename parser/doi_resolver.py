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
from urllib.parse import urlparse
import json
import os
import requests
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

    """
    Compiles date into "30 Jul 2015" format
    """
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

        # Send request to grab metadata at URL
        url = "http://dx.doi.org/" + doi
        headers = {"accept": "application/rdf+xml;q=0.5, application/citeproc+json;q=1.0"}
        r = requests.get(url, headers=headers)
        metadata = json.loads(r.text)

        # Create a new pub dictionary with metadata received
        new_metadata = OrderedDict()
        # No abstract field??
        new_metadata['authors'] = self.compile_authors(metadata['author'])
        new_metadata['title'] = metadata['title']
        new_metadata['journal'] = metadata['container-title']
        new_metadata['pubYear'] = self.compile_pubyear(metadata['issued']['date-parts'])
        new_metadata['volume'] = metadata['volume']
        new_metadata['publisher'] = metadata['publisher']
        new_metadata['page'] = metadata['page']
        new_metadata['DOI'] = doi
        new_metadata['issue'] = metadata['issue']

        return new_metadata

    """
    Main function that gets files, creates outputs, and runs all operations on files
    """
    def run(self):

        # Choose the directory that has files. For debugging use only. Production will run script on current file.
        directory = '/Users/chrisheiser1/Desktop/todoi/'
        os.chdir(directory)

        file_list = []

        # Delete any doi files that are in the dir. New update files will be created in their place.
        for file in os.listdir():
            if file.endswith('.lipd'):
                if '-doi' in file:
                    os.remove(file)
                else:
                    file_list.append(file)

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
                print("No DOI found")

            file_out.close()

# sample doi: 'http://dx.doi.org/10.1029/2002PA000846'
DOIResolver()

__author__ = 'Chris Heiser, Austin McDowell'

"""
CHANGELOG
Version 1.1 Tuesday, July 5, 2015 by Chris
Version 1.0 Tuesday, June 9, 2015 by Austin

Input:  '.lipd' file

Output: '-doi.lipd' file that has populated 'pub' fields resolved from the DOI (if there is one) parsed from the
original .lipd file.

"""

from urllib.parse import urlparse
import json
import requests
import calendar

class DOIResolver(object):

    def __init__(self):
        self = self

    """
    Returns DOI ID reference (i.e. 10.1029/2005pa001215)
    """
    def clean(self, doi):
        doi = doi.replace(" ", "")
        if 'http' in doi:
            doi = urlparse(doi)[2]
        return doi

    """
    Compiles date into "30 Jul 2015" format
    """
    def compile_date(self, date_parts):
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
            out.append({'name': person['given'] + " " + person['family']})
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
    def get_data(self, pub_dict):

        # Send request to grab metadata at URL
        url = "http://dx.doi.org/" + pub_dict['doi']
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
        for k, v in raw.items():
            print('k: {0}, v:{1}'.format(k, v))

        # Create a new pub dictionary with metadata received
        fetch_dict = {}
        fetch_dict['author'] = self.compile_authors(raw['author'])
        fetch_dict['title'] = raw['title']
        fetch_dict['journal'] = raw['container-title']
        fetch_dict['year'] = self.compile_date(raw['issued']['date-parts'])
        fetch_dict['volume'] = raw['volume']
        fetch_dict['publisher'] = raw['publisher']
        fetch_dict['page'] = raw['page']
        fetch_dict['issue'] = raw['issue']
        fetch_dict['identifier'] = [{"type": "doi", "id": pub_dict["doi"]}]

        pub_dict = self.compare_replace(pub_dict, fetch_dict)

        return pub_dict

    """
    Main function that gets files, creates outputs, and runs all operations on files
    """
    def run(self, pub_dict):

        """
        USE FOR RUNNING AS AN INLINE PROCESS TO THE MAIN PARSER
        """
        pub_dict['doi'] = self.clean(pub_dict['doi'])
        return self.get_data(pub_dict)

    def run_standalone(self):
        """
        CODE IRRELEVANT UNLESS RUNNING AS A STANDALONE PROCESS

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
            # self.start = txt

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
            """

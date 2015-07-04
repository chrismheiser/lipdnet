__author__ = 'Austin McDowell'
'''
############################################
Version 1.0 COMPLETED: Tuesday, June 9, 2015
############################################

Input:  '.jsonld' file

Output: '-doi.jsonld' file that has populated 'pub' fields resolved from the 
		DOI (if there is one) parsed from the original .jsonld file.

############################################
What needs to be done:
	
	Code creates new file with extension '-doi.jsonld': 		DONE
	Code writes all content from original file to new file: 	DONE
	Code populates 'pub' fields if there is a DOI: 				DONE
	DOI isn't correctly pulled from all files: 					DONE
	Only the last file run through is actually written to:   	DONE
	Authors field isn't populated correctly in every file:		DONE

############################################
'''
from collections import OrderedDict
from os import listdir
import json
import os
import requests


class DOIResolver:

    def __init__(self):
        self.main()

    # cleans up initial DOI entered; program only wants the trail numbers
    def clean(self, doi):

        # for DOIs that start with 'doi:...' or 'DOI:...' or any conbination of that
        if self.doi[0] == 'd' or self.doi[0] == 'D':
            self.doi = self.doi[4:]

        # for DOIs that start with 'http//...'
        if self.doi[0] == 'h':
            self.doi = self.doi[18:]

        if self.doi.startswith(' '):
            self.doi = self.doi[1:]

        if self.doi.endswith(' '):
            self.doi = self.doi[:-1]

        # return the cleaned DOI
        return self.doi

    def get_data(self):

        # OUTPUT VARIABLES
        url = "http://dx.doi.org/" + self.doi
        year = ''
        month = ''
        publisher = ''
        volume = ''
        edition = ''
        pages = ''
        author = ''
        authors = ''
        title = ''
        journal = ''

        #################	GRABS METADATA   #################
        headers = {"accept": "application/x-bibtex"}
        r = requests.get(url, headers=headers)
        metadata = str(r.text)
        ######################################################

        # Use to test if it's putting the metadata in the correct spots
        # print(metadata)

        count = 0

        # separates each line for individual use
        for line in metadata.splitlines():
            # to get each line in the metadata string printed by 'print(metadata)' line
            count += 1

            for i in line:
                if count == 4:
                    year = line[8:-1]
                if count == 5:
                    month = line[10:-2]
                if count == 6:
                    publisher = line[14:-2]
                if count == 7:
                    volume = line[11:-2]
                if count == 8:
                    edition = line[11:-2]
                if count == 9:
                    pages = line[10:-2]
                if count == 10:
                    author = line[11:-2]
                if count == 11:
                    title = line[10:-2]
                if count == 12:
                    journal = line[12:-1]

        authors = author.split(' and ')
        new_authors = self.prettify_authors(authors)

        """
        # use if "lastName, firstName" is important
        new_authors = self.split_authors(authors)
        print(new_authors)

        # print for checking if we are returning the correct values
        print(new_authors)
        print(authors)
        """

        with open(self.start) as f:
            with open(self.file, 'w') as jsonFile:
                for line in iter(f):
                    jsonFile.write(line)

            with open(self.file, 'r') as jsonFile:
                self.data = json.load(jsonFile)

            # populate the fields in 'pub' section of new jsonld file
            populate = self.data['pub']

            if 'authors' not in populate:
                populate['author'] = new_authors
            else:
                populate['authors'] = new_authors

            populate['title'] = title
            populate['journal'] = journal
            populate['pubYear'] = month + ", " + year
            populate['volume'] = volume
            populate['publisher'] = publisher
            populate['edition'] = edition
            populate['pages'] = pages
            populate['DOI'] = self.doi

            with open(self.file, 'w+') as jsonFile:
                jsonFile.write(json.dumps(self.data, sort_keys=True, indent=4))

    """
    Splits up the authors returned from get_data() into a usable format:
    i.e. get_data() returns authors = {"David J. R. Thornalley and Harry Elderfield and I. Nick McCave"}
    and we want, ['Thornalley, David', 'Elderfield, Harry', 'McCave, I.'] so they can later be moved individually
    into the jsonld file currently being populated with data
    """

    def split_authors(self, authors):
        output = []
        switched_name = ''

        for i in range(0, len(authors)):
            name = authors[i].split(' ')
            switched_name = name[-1] + ', ' + name[0]
            output.append(switched_name)

        return output

    def prettify_authors(self, authors):
        output = {}
        count = 0
        new_name = ''
        for i in range(0, len(authors)):
            new_name = (str(authors[i]))
            output[count] = new_name
            count += 1

        return output

    # come back to later
    # trying to change 'keys' in 'authors' from numbers to 'name'
    # i.e. currently it is '0' : 'authors name'
    # want it to be 'name' : 'authors name'
    def name_keys(self, data):
        for key in data.keys():
            num = key
            new_key = key.replace(num, 'name')
        return data

    def main(self):
        directory = 'DataToDOI/'
        file_list = []
        folder_list = []

        # change directory to wherever our .jsonld files are
        os.chdir(directory)

        for file in os.listdir():
            # print(file)
            folder_list.append(file)
            for i in folder_list:
                os.chdir(i + '/')
                for file in os.listdir():
                    # print(file)
                    if file.endswith('-doi.jsonld'):
                        os.remove(file)
                    elif file.endswith('.jsonld'):
                        file_list.append(file)
                os.chdir('..')
        os.chdir('..')

        # check to see which files are added to file_list
        # print(file_list)


        for txts in file_list:

            self.start = directory + txts[:-7] + '/' + str(txts)

            self.doi = ''
            extension = txts[:-7] + '/'

            # print(extension)

            with open(directory + extension + txts) as f:
                for line in iter(f):
                    # pull out just the DOI
                    if '"id"' in line:
                        self.doi = line[12:-3]

                    elif '"DOI"' in line or '"doi"' in line:
                        self.doi = line[17:-3]

                        # print(self.doi)

            # Cut the extension from the file name
            if '-lpd.json' in txts:
                name = txts.split('-')
            else:
                name = txts.split(".j")

            # Creates the directory 'output' if it does not already exist
            # os.chdir(directory)
            # if not os.path.exists('output/'):
            # os.makedirs('output/')

            # Naming setup
            out_name = name[0] + '-doi.jsonld'

            # Create a new output text file
            self.file_out = open(directory + txts[:-7] + '/' + out_name, 'w+')
            self.file = directory + txts[:-7] + '/' + out_name

            self.file_out.close()

            # if there is no DOI then this code isn't needed
            if self.doi != '':
                # cleans the DOI if needed
                self.clean(self.doi)

                # runs the program once files are created
                self.get_data()

            print(txts)

# doi for reference: 'http://dx.doi.org/10.1029/2002PA000846'
DOIResolver()

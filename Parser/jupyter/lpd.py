from Parser.modules.zips import *
from Parser.modules.directory import *
from Parser.modules.bag import *
import json
import csv


class LiPD(object):
    """
    LiPD objects are meant to represent all the data needed to analyze a LiPD file. The object will open a LiPD file,
    allow you to analyze and query data within, modify, save, and close.
    """

    def __init__(self, dir_root, dir_tmp, name_ext):
        self.name_ext = name_ext
        self.name = os.path.splitext(name_ext)[0]
        self.dir_root = dir_root
        self.dir_tmp = dir_tmp
        self.dir_bag = os.path.join(dir_tmp, self.name)
        self.dir_data = os.path.join(self.dir_bag, 'data')
        self.csv_data = {}
        self.master_data = {}

    # OPENING

    def load(self):
        # unzip lpd file to tmp workspace (in it's own folder)
        unzip(self.name_ext, self.dir_tmp)
        self.addJSON()
        self.addCSV()
        return

    # ANALYSIS

    def displayCSV(self):
        print(json.dumps(self.csv_data, indent=2))

    def displayData(self):
        """
        Display all data for this file. Pretty print for readability.
        :return: None
        """
        print(json.dumps(self.master_data, indent=2))

    # CLOSING

    def save(self):
        # write new CSV data to new CSV files
        # remove CSV data from self.data dictionary
        # write self.data dictionary to .jsonld file (overwrite the old one)
        # run dir_cleanup (deletes old bag files and moves all data files to bag root)
        # bag the directory (dir_bag)
        # zip the directory (with the destination being the dir_root / overwrites old LPD file)
        pass

    def close(self):
        # close without saving
        # remove its folder from the tmp directory
        pass

    # HELPERS

    def addCSV(self):
        os.chdir(self.dir_data)
        # Track list of available CSV files (from paleoData[table]["filename"] in JSON)
        # filenames = []
        # loop through each table in paleoData
        for table in self.data['paleoData']:
            # Append CSV filename to list
            # filenames.append(table['filename'])
            # Create CSV entry into globabl self.csv_data that contains all columns.
            self.getCSV(table['filename'])
            # Start putting CSV data into columns using the self.csv_data as source.
            for idx, col in table['columns']:
                col['values'] = self.csv_data[table['filename']][idx]

        os.chdir(self.dir_root)
        return

    def removeCSV(self):
        """
        Remove all CSV entries from the JSON structure.
        :return: None
        """
        os.chdir(self.dir_data)
        # Loop through each table in paleoData
        for table in self.data['paleoData']:
            try:
                # try to delete the values key entry
                del self.data['paleoData'][table]['values']
            except ValueError:
                # if the key doesn't exist, keep going
                pass
        os.chdir(self.dir_root)
        return

    def writeCSV(self):
        """
        Write all CSV data in self.data to write CSV files. (Overwrites CSVs)
        :return: None
        """
        pass

    def writeJSON(self):
        """
        Write all JSON data in self.data to a new jsonld file. (Overwrites jsonld)
        :return: None
        """
        pass

    def getCSV(self, filename):
        d = {}
        try:
            with open(filename, 'r') as f:
                r = csv.reader(f, delimiter=',')
                # Create a dict with X lists corresponding to X columns
                for idx, col in enumerate(next(r)):
                    d[idx] = []
                # Start iter through CSV data
                for row in r:
                    for idx, col in enumerate(row):
                        # Append the cell to the correct column list
                        d[idx].append(col)
        except FileNotFoundError:
            print('CSV: FileNotFound')
        self.csv_data[filename] = d
        return

    def addJSON(self):
        try:
            # Open jld file and read in the contents. Execute DOI Resolver?
            with open(os.path.join(self.dir_data, self.name + '.jsonld'), 'r') as jld_file:
                # set all the json data
                self.data = json.load(jld_file)
        except FileNotFoundError:
            print("Lpd object: Load(). file not found")
        return

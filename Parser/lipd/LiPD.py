from Parser.modules.zips import *
from Parser.modules.directory import *
from Parser.modules.bag import *
from Parser.modules.csvs import *
from Parser.modules.jsons import *


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
        self.dir_tmp_bag = os.path.join(dir_tmp, self.name)
        self.dir_tmp_bag_data = os.path.join(self.dir_tmp_bag, 'data')
        self.data_csv = {}
        self.data_json = {}
        self.data_master = {}

    # OPENING

    def load(self):
        # Unzip LiPD into tmp folder
        unzip(self.name_ext, self.dir_tmp)

        # Import JSON into object
        os.chdir(self.dir_tmp_bag_data)

        # Read in JSON, and switch to new structure
        j = old_to_new_structure(read_json_from_file(self.name + '.jsonld'))

        # Set JSON to object self
        self.data_master = j
        self.data_json = copy.deepcopy(j)

        # Import CSV into data_master, and set csv data to self.
        self.data_master['paleoData'], self.data_csv = add_csv_to_json(self.data_master['paleoData'])

        os.chdir(self.dir_root)

        return

    # ANALYSIS

    def display_csv(self):
        """
        Display only CSV data
        :return: None
        """
        print(json.dumps(self.data_csv, indent=2))

    def display_data(self):
        """
        Display CSV and JSON data.
        :return: None
        """
        print(json.dumps(self.data_json, indent=2))

    def get_data_master(self):
        return self.data_master

    # CLOSING

    def save(self):
        # Move to data files
        os.chdir(self.dir_tmp_bag_data)

        # Overwrite csv data to CSV files. Call once for each CSV file.
        for filename, columns in self.data_csv.items():
            write_csv_to_file(filename, columns)

        # Remove CSV data from self.data_master and update self.data_json
        self.data_json = remove_csv_from_json(self.data_master)

        # Switch JSON back to old structure
        self.data_json = new_to_old_structure(self.data_json)

        # Overwrite JSON dictionary to file
        write_json_to_file(self.name_ext, self.data_master)

        # Cleanup directory and prep for bagit
        dir_cleanup(self.dir_tmp_bag, self.dir_tmp_bag_data)

        # Call bagit
        create_bag(self.dir_tmp_bag)

        # Zip directory and overwrite LiPD file
        re_zip(self.dir_tmp, self.name, self.name_ext)

        # Move back to root
        os.chdir(self.dir_root)
        return

    def remove(self):
        """
        Remove the tmp folder for this object. Do not save data.
        :return: None
        """
        shutil.rmtree(self.dir_tmp)
        return

    # HELPERS

    def load_tso(self, metadata):
        """
        Overwrite LiPD self.data_master with metadata from TSO.
        :param metadata: (dict) Metadata from TSO
        """
        self.data_master = metadata
        # # strip the values from the metadata, and put it into { table: {col1: vals, col2: vals,..}}
        # self.data_csv = ''
        # # strip the valies from the metadata, and set json here.
        # self.data_json = ''







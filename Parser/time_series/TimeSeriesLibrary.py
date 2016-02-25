from Parser.time_series.TimeSeries import *


class TimeSeriesLibrary(object):
    def __init__(self):
        self.master = {}
        self.dir_root = '/Users/chrisheiser1/Desktop/lipds'

    def load(self, name, TSO):
        self.master[name] = TSO

    def load_tso(self):
        pass

    def load_tsos(self):
        pass

    def show_files(self):
        """
        Display all LiPD files in the LiPD Library
        :return:
        """
        for name, tso in self.master.items():
            print(name)
        return

    def extract_lipd(self, tso):
        """
        Convert one specified TSO to LiPD. Add to LiPD Library.
        :param tso: (obj)
        :return: None
        """
        # Call main conversion function here.

        pass

    def extract_lipds(self):
        """
        Convert all TSOs to LiPD. Add to LiPD Library.
        :return:
        """
        for name, tso in self.master.items():
            # Call main conversion function here.
            pass

    def save_tso(self, tso):
        """
        Write data for one specified TSO to file.
        :param tso: (obj)
        :return:
        """
        pass

    def save_tsos(self):
        """
        Write data from all TSOs to file.
        :return:
        """
        pass


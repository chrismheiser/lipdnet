from Parser.time_series.TimeSeries import *
from Parser.jupyter.LiPD_Library import *
from Parser.modules.Convert import *


class TimeSeries_Library(object):
    def __init__(self):
        self.master = {}

    def load(self, name, TSO):
        self.master[name] = TSO

    def load_tsos(self, d):
        """
        :param d: (dict) All TSOs resulting from one LiPD file.
        :return:
        """
        # Create a TSO for each, and load into the TS_Library master
        for k, v in d.items():
            self.master[k] = TimeSeries().load(v)
        return

    def show_files(self):
        """
        Display all LiPD files in the LiPD Library
        :return:
        """
        for name, tso in self.master.items():
            print(name)
        return

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

    def get_master(self):
        """
        Get master list of TSO names and TSOs
        :return: (dict) Master dictionary
        """
        return self.master


from Parser.time_series.TimeSeries import *


class TimeSeriesLibrary(object):
    def __init__(self):
        self.master = {}
        self.dir_root = '/Users/chrisheiser1/Desktop/lipds'

    def load(self, name, TSO):
        self.master[name] = TSO

    def load_x(self):
        pass

    def load_all(self):
        pass

    def showFiles(self):
        """
        Display all LiPD files in the LiPD Library
        :return:
        """
        for k, v in self.master.items():
            print(k)
        return



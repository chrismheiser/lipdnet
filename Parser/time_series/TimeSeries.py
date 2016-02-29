from Parser.modules.Convert import *


class TimeSeries(object):
    def __init__(self):
        self.master = {}
        self.filename = ''

    def load(self, d):
        """
        Load TimeSeries metadata into object
        :param d: (dict) TS Metadata
        """
        self.master = d

    def set_filename(self, filename):
        """
        Set the filename to match LiPD filename counterpart
        :param filename: (str) LiPD Filename
        """
        self.filename = filename

    def get_master(self):
        """
        Get all metadata from the object
        :return: (dict) Metadata
        """
        return self.master

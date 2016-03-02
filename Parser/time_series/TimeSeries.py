
class TimeSeries(object):
    def __init__(self):
        self.master = {}
        self.filename = ''
        self.dataSetName = ''

    def load(self, d):
        """
        Load TimeSeries metadata into object
        :param d: (dict) TS Metadata
        """
        self.master = d
        return

    def set_filename(self, filename):
        """
        Set the filename to match LiPD filename counterpart
        :param filename: (str) LiPD Filename
        """
        self.filename = filename
        return

    def set_datasetname(self, name):
        """
        Set the data set name for this TSO
        :param name: (str) Name
        """
        self.dataSetName = name
        return

    def get_master(self):
        """
        Get all metadata from the object
        :return: (dict) Metadata
        """
        return self.master

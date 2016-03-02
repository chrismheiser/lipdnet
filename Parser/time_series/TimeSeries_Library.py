from Parser.time_series.TimeSeries import TimeSeries


class TimeSeries_Library(object):
    def __init__(self):
        self.master = {}

    def load(self, name, d):
        """
        Load in a single TimeSeries Objects.
        :param name: (str) TSO name
        :param d: (dict) TSO metadata
        """
        t = TimeSeries()
        t.load(d)
        self.master[name] = t
        return

    def load_tsos(self, d):
        """
        Load in multiple TimeSeries Objects.
        :param d: (dict) All TSOs resulting from one LiPD file. K: TS names, V: TS metadata
        """
        # Create a TSO for each, and load into the TS_Library master
        for k, v in d.items():
            t = TimeSeries()
            t.load(v)
            t.set_filename(k)
            t.set_datasetname(v['dataSetName'])
            self.master[k] = t
        return

    def show_file(self, name):
        """
        Show contents of one TSO object.
        :param name:
        :return:
        """
        for k, v in self.master[name].get_master().items():
            print(k, v)
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


import cmd

from Parser.modules.Convert import *
from Parser.time_series.TimeSeries_Library import *
from Parser.lipd.LiPD_Library import *


class LiPD_CLI(cmd.Cmd):
    """
    - Command arguments are in the form of: "command <space> args"
    - all commands must have (self, arg) parameters at a minimum.
    """

    intro = "Welcome to LiPD. Type help or ? to list commands.\nSet the current working directory before proceeding\n"
    prompt = '(lipd) '

    def __init__(self):
        cmd.Cmd.__init__(self)
        self.lipd_lib = LiPD_Library()
        self.ts_lib = TimeSeries_Library()
        self.convert = Convert()

    # GETTING STARTED

    def do_setDir(self, path):
        """
        Set the current working directory by providing a directory path.
        (ex. /Path/to/files)
        :param path: (str) Directory path
        """
        self.lipd_lib.setDir(path)

    def do_loadLipd(self, filename):
        """
        Load a single LiPD file into the workspace. File must be located in the current working directory.
        (ex. loadLiPD NAm-ak000.lpd)
        :param filename: (str) LiPD filename
        """
        self.lipd_lib.loadLipd(filename)

    def do_loadLipds(self, arg):
        """
        Load all LiPD files in the current working directory into the workspace.
        """
        self.lipd_lib.loadLipds()

    # ANALYSIS - LIPD

    def do_extractTimeSeries(self, arg):
        """
        Create a TimeSeries using the current files in LiPD_Library.
        :return: (obj) TimeSeries_Library
        """
        # Loop over the LiPD objects in the LiPD_Library
        for k, v in self.lipd_lib.get_master().items():
            # Get metadata from this LiPD object. Convert it. Pass TSO metadata to the TS_Library.
            self.ts_lib.load_tsos(self.convert.ts_extract_main(v.get_data_master()))

    def do_showCsv(self, filename):
        """
        Show CSV data for one LiPD
        :param filename:
        :return:
        """
        self.lipd_lib.showCsv(filename)

    def do_showLipd(self, filename):
        """
        Display the contents of the specified LiPD file. (Must be previously loaded into the workspace)
        (ex. displayLiPD NAm-ak000.lpd)
        :param filename: (str) LiPD filename
        """
        self.lipd_lib.showLipd(filename)

    def do_showFiles(self, arg):
        """
        Prints the names of all LiPD files in the LiPD_Library
        """
        self.lipd_lib.showFiles()

    def do_map(self, filename):
        """

        :param filename:
        :return:
        """
        # No input given. Map all LiPDs
        if not filename:
            self.lipd_lib.showAllMap()
        # One or more records given. Map them.
        else:
            self.lipd_lib.showMap(filename)
        return

    # ANALYSIS - TIME SERIES

    def do_exportTimeSeries(self, arg):
        """
        Export TimeSeries back to LiPD Library. Overwrite LiPD_Library.
        :return: (obj) LiPD_Library
        """
        l = []
        # Get all TSOs from TS_Library, and add them to a list
        for k, v in self.ts_lib.get_master().items():
            l.append(v.get_master())
        # Send the TSOs list through to be converted. Then let the LiPD_Library load the metadata into itself.
        self.lipd_lib.load_tsos(self.convert.lipd_extract_main(l))

    def do_showTimeSeries(self, arg):
        """
        Prints the names of all TimeSeries files in the TimeSeries_Library
        :return:
        """
        self.ts_lib.show_files()

    def do_showTimeSeriesFile(self, name):
        """
        Show contents of one TSO.
        :param name:
        :return:
        """
        self.ts_lib.show_file(name)

    # CLOSING

    def do_saveLipd(self, filename):
        """
        Saves changes made to the target LiPD file.
        (ex. saveLiPD NAm-ak000.lpd)
        :param filename: (str) LiPD filename
        """
        self.lipd_lib.saveLipd(filename)

    def do_saveLipds(self, arg):
        """
        Save changes made to all LiPD files in the workspace.
        """
        self.lipd_lib.saveLipds()

    def do_removeLipd(self, filename):
        """
        Remove LiPD object from library
        :return: None
        """
        self.lipd_lib.removeLipd(filename)
        return

    def do_removeLipds(self, arg):
        """
        Remove all LiPD objects from library.
        :return: None
        """
        self.lipd_lib.removeLipds()
        return

    def do_quit(self, arg):
        """
        Quit and exit the program. (Does not save changes)
        """
        # self.llib.close()
        return True


# if __name__ == '__main__':
LiPD_CLI().cmdloop()

import cmd

from Parser.jupyter.LiPD_Library import *


class LiPD_CLI(cmd.Cmd):
    """
    - Command arguments are in the form of: "command <space> args"
    - all commands must have (self, arg) parameters at a minimum.
    """

    intro = "Welcome to LiPD. Type help or ? to list commands.\nSet the current working directory before proceeding\n"
    prompt = '(lipd) '

    def __init__(self):
        cmd.Cmd.__init__(self)
        self.llib = LiPD_Library()

    # GETTING STARTED

    def do_setDir(self, path):
        """
        Set the current working directory by providing a directory path.
        (ex. /Path/to/files)
        :param path: (str) Directory path
        """
        self.llib.setDir(path)

    def do_loadLipd(self, filename):
        """
        Load a single LiPD file into the workspace. File must be located in the current working directory.
        (ex. loadLiPD NAm-ak000.lpd)
        :param filename: (str) LiPD filename
        """
        self.llib.loadLipd(filename)

    def do_loadLipds(self, arg):
        """
        Load all LiPD files in the current working directory into the workspace.
        """
        self.llib.loadLipds()

    # ANALYSIS

    def do_showCsv(self, filename):
        """
        Show CSV data for one LiPD
        :param filename:
        :return:
        """
        self.llib.showCsv(filename)

    def do_showLipd(self, filename):
        """
        Display the contents of the specified LiPD file. (Must be previously loaded into the workspace)
        (ex. displayLiPD NAm-ak000.lpd)
        :param filename: (str) LiPD filename
        """
        self.llib.showLipd(filename)

    def do_showFiles(self, arg):
        """
        Prints filenames of all LiPD files currently loaded in the workspace.
        """
        self.llib.showFiles()

    def do_map(self, filename):
        """

        :param filename:
        :return:
        """

        self.llib.showMap(filename)

    # CLOSING

    def do_saveLipd(self, filename):
        """
        Saves changes made to the target LiPD file.
        (ex. saveLiPD NAm-ak000.lpd)
        :param filename: (str) LiPD filename
        """
        self.llib.saveLipd(filename)

    def do_saveLipds(self, arg):
        """
        Save changes made to all LiPD files in the workspace.
        """
        self.llib.saveLipds()

    def do_removeLipd(self, filename):
        """
        Remove LiPD object from library
        :return: None
        """
        self.llib.removeLipd(filename)
        return

    def do_removeLipds(self, arg):
        """
        Remove all LiPD objects from library.
        :return: None
        """
        self.llib.removeLipds()
        return

    def do_quit(self, arg):
        """
        Quit and exit the program. (Does not save changes)
        """
        # self.llib.close()
        return True


# if __name__ == '__main__':
LiPD_CLI().cmdloop()

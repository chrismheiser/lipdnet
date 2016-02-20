import cmd

from Parser.time_series.TimeSeriesLibrary import *


class LiPD_CLI(cmd.Cmd):
    """
    - Command arguments are in the form of: "command <space> args"
    - all commands must have (self, arg) parameters at a minimum.
    """

    intro = "Welcome to TimeSeries. Type help or ? to list commands.\nSet the current working directory before proceeding\n"
    prompt = '(timeseries) '

    def __init__(self):
        cmd.Cmd.__init__(self)
        self.ts = TimeSeriesLibrary()

    # GETTING STARTED

    def do_setDir(self):
        self.ts.setPath()

    def do_load(self,):
        pass

    def do_showFiles(self):
        self.ts.showFiles()
        return

    def do_quit(self, arg):
        """
        Quit and exit the program. (Does not save changes)
        """
        # self.llib.close()
        return True


# if __name__ == '__main__':
LiPD_CLI().cmdloop()

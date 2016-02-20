from Parser.modules.ts import *


class TimeSeries(object):
    def __init__(self):
        self.master = {}
        self.filename = ''

    def load(self, d):
        self.master = d
        # return self

    def set_filename(self, filename):
        self.filename = filename


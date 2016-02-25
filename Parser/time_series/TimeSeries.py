from Parser.modules.ts import *


class TimeSeries(object):
    def __init__(self):
        self.master = {}
        self.data_set_name = ''
        self.data_table_name = ''
        self.number = ''

    def load(self, d):
        self.master = d
        self.data_table_name = self.master['paleoData_paleoDataTableName']
        self.number = self.master['paleoData_number']

    def set_filename(self, data_set_name):
        self.data_set_name = data_set_name


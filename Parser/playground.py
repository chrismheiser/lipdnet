import os
from Parser.modules.csvs import *
from Parser.modules.jsons import *


EMPTY = ['', ' ', None, 'na', 'n/a', 'nan', '?']
BAD = ['\n']


def cast_csvs():
    os.chdir('/Users/chrisheiser1/Desktop')
    d = read_csv_from_file('test.csv')
    for k,v in d.items():
        for i in v:
            print(type(i))
    return

cast_csvs()

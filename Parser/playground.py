import os
from Parser.modules.csvs import *
from Parser.modules.jsons import *


EMPTY = ['', ' ', None, 'na', 'n/a', 'nan', '?']
BAD = ['\n']


def forward(d):
    pd = {}

    # create paleodata with table names as keys
    for table in d['paleoData']:
        pd[table['tableName']] = table

    for

    return d


def backward(d):

    return d


def main():
    os.chdir('/Users/chrisheiser1/Desktop')
    d = read_json_from_file('test.json')

    print("ORIGINAL")
    print(d)
    print('\n')

    print("FORWARD")
    f = forward(d)
    print(f)
    print("\n")

    print("BACKWARD")
    b = backward(f)
    print(b)
    print("\n")

    return

main()

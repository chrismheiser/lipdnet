import os

# from Parser.under_construction.flattener.flatten_test import *
from Parser.under_construction.flattener.flatten import *
from Parser.modules.jsons import *
from Parser.modules.google import *

EMPTY = ['', ' ', None, 'na', 'n/a', 'nan', '?']


def main():
    os.chdir('/Users/chrisheiser1/Desktop')
    # jd = read_json_from_file('ns_test.json')

    #old to new structure
    # jd = old_to_new_structure(jd)
    # write_json_to_file('new_struct_test.json', jd)

    # Flatten Class
    # jo = Flatten(jd).start()
    # write_json_to_file('flatten_class.json', jo)

    # flatten_test
    # jo = run(jd)
    # write_json_to_file('flatten_test.json', jo)

    return

main()

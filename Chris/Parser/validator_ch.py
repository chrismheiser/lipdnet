import json
import re

# Take in the string of the attr. path, and split it into a list
# Accept: str
# Return: list
def path_str_split(str_path):
    return re.split(r'[-:]*', str_path)

# Deeper check for column attr's and such (low level)
def secondary_check():
    return

# Simple if statements to check for the easy attr's (high level)
def first_checks(str_path):
    path_list = path_str_split(str_path)
    print(path_list)
    return

# Main method
def run():
    file = 'test_flat.json'
    flat_json = open(file)
    data = json.load(flat_json)
    for item in data:
        first_checks(item)
    return

run()
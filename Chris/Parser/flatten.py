# This is a python package for flattening JSON files #
import json

"""
maybe try to track how many times it should dive based on the key.
ex: if it's geo, it should loop 3 times, latitude loop 3 times
After it loops what it's supposed to, it removes all signs of those loops from the current path

"""
def flatten(data_in, current, overall):


    ## NEW IDEA
    ## when looping, check if your current dictionary consists only of k,v strings.
    ## if so, use the current path, and loop for each item to concat a string of the full path.
    bottom = True
    for k, v in data_in.items():
        if not isinstance(v, (str, int)):
            bottom = False



    ## If there are items in the dictionary that are not string pairs, then act normal.
    for k, v in data_in.items():
        if isinstance(v, dict):
            current.append(k)
            flatten(v, current, overall)

        elif isinstance(v, list):
            current.append(k)
            for items in v:
                flatten(items, current, overall)

        else:
            current.append(k)
            current.append(v)
            curr_string = to_string(current)
            if curr_string not in overall:
                overall.append(curr_string)
            current.remove(v)
            current.remove(k)

    return overall

def to_string(list_in):
    new = list(set(list_in))
    return ':'.join(map(str, new))

def run():
    current = []
    overall = []
    json_path = 'test.jsonld'
    json_data = open(json_path)
    data = json.load(json_data)
    out = flatten(data, current, overall)
    json_data.close()
    for i in out:
        print(i)

run()
# This is a python package for flattening JSON files #
import json

def flatten(flat_file):

	print(flat_file)


def main():
	json_path = 'test.jsonld'
	json_data = open(json_path)
	data = json.load(json_data)
	flatten(data)
	json_data.close()

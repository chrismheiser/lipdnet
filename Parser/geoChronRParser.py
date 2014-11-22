import xlrd
import os
from parser_jsonld import *

def parser():

	list_of_files = open('file_list.txt', 'r')

	for i in list_of_files:
		current_file = i

	workbook = xlrd.open_workbook(current_file)

	metadata = workbook.sheet_by_index(0)
	data = workbook.sheet_by_index(1)
	chronology = workbook.sheet_by_index(2)
	proxyList = workbook.sheet_by_index(3)

	print(metadata.nrows, metadata.ncols)

	name = ''

	study_title = metadata.cell_value(1,1)

	new_file_name_jsonld = str(study_title) + '/' + str(study_title) + '.jsonld'
	new_file_name_csv = str(study_title) + '/' + str(study_title) + '.csv'

	if not os.path.exists('folders/' + str(study_title)):
		os.makedirs('folders/' + str(study_title))

	file_jsonld = open('folders/' + new_file_name_jsonld, 'w')
	file_csv = open('folders/' + new_file_name_csv, 'w')

	file_jsonld = open('folders/' + new_file_name_jsonld, 'r+')
	file_csv = open('folders/' + new_file_name_csv, 'r+')

	file_jsonld.write('{\n')
	file_jsonld.write('		"@context" : "context.jsonld"\n')
	file_jsonld.write('}\n')
	file_jsonld.write('\n')

	file_jsonld.write('{"siteName" 		 : "' + study_title + '"}\n')
	file_jsonld.write('{"collectionName" : "' + str(metadata.cell_value(30,1)) + '"}\n')
	file_jsonld.write('{"region" : "' + '' + '"}\n')	





parser()
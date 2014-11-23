
def jsonld_parser(file_name):

	file_name.write('{\n')
	file_name.write('		"@context": "context.jsonld"\n')
	file_name.write('}\n')


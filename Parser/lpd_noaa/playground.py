from collections import OrderedDict

lat = []
lon = []
geo = OrderedDict()
geo_geometry = OrderedDict()
geo_properties = OrderedDict()

tests = {'test1' : ['Northernmost_Latitude: 67.7', 
					'Southernmost_Latitude: 66.0',
					'Easternmost_Longitude: 71.2',
					'Westernmost_Longitude: 65.6' ],
		'test2' : ['Northernmost_Latitude: 67.7', 
					'Southernmost_Latitude: 67.7',
					'Easternmost_Longitude: 71.2',
					'Westernmost_Longitude: 71.2' ],
		'test3' : ['Northernmost_Latitude: 67.7', 
					'Southernmost_Latitude: ',
					'Easternmost_Longitude: 71.2',
					'Westernmost_Longitude: ' ],
		'test4' : ['Northernmost_Latitude: ', 
					'Southernmost_Latitude: 66.0',
					'Easternmost_Longitude: ',
					'Westernmost_Longitude: 65.6' ]
					}

# Lists for what keys go in specific dictionary blocks
geo_keys = {'lat': ['northernmostlatitude', 'northernmost latitude','northernmost_latitude', 
					'southernmostlatitude', 'southernmost latitude', 'southernmost_latitude'],
            'lon': ['easternmostlongitude', 'easternmost longitude', 'easternmost_longitude',
            		'westernmostlongitude', 'westernmost longitude', 'westernmost_longitude'],
            'places': ['location', 'country'],
            'elev': ['elevation']
            }

def convert_num(number):
    try:
        return float(number)
    except ValueError:
        return number

def slice_key_val(line):
    position = line.find(":")
    # If value is -1, that means the item was not found in the string.
    if position != -1:
        key = line[:position]
        value = line[position+1:]
        value = value.lstrip()
        return key, value
    else:
        key = line
        value = None
        return key, value

def geo_multipoint(lat, lon):

	geo_dict = OrderedDict()
	geometry_dict = OrderedDict()
	coordinates = []
	bbox = []
	temp = [None, None]

	# if the value pairs are matching, then it's not a real MultiPoint type. Send to other method
	if lat[0] == lat[1] and lon[0] == lon[1]:
		lat.pop()
		lon.pop()
		geo_dict = geo_point(lat, lon)

	# 4 unique values
	else:
		# Creates bounding box
		for index, point in enumerate(lat):
			bbox.append(lat[index])
			bbox.append(lon[index])

		# Creates coordinates list
		for i in lat:
			temp[0] = i
			for j in lon:
				temp[1] = j
				coordinates.append(temp)

		# Create geometry block
		geometry_dict['type'] = 'MultiPoint'
		geometry_dict['coordinates'] = coordinates

		# Create geo block
		geo_dict['type'] = 'Featured'
		geo_dict['bbox'] = bbox
		geo_dict['geometry'] = geometry_dict

	return geo_dict

def geo_point(lat, lon):

	coordinates = []
	geo_dict = OrderedDict()
	geometry_dict = OrderedDict()
	for index, point in enumerate(lat):
		coordinates.append(lat[index])
		coordinates.append(lon[index])
	geometry_dict['type'] = 'Point'
	geometry_dict['coordinates'] = coordinates
	geo_dict['type'] = 'Feature'
	geo_dict['geometry'] = geometry_dict

	return geo_dict



# use to determine 2-point or 4-point coordinates
# return geometry dict, and (multipoint/bbox or point) type
def create_coordinates(lat, lon):

	# sort lat and lon points into numerical order
	lat.sort()
	lon.sort()

	# 4 coordinate values
	if len(lat) == 2 and len(lon) == 2:
		geo_dict = geo_multipoint(lat, lon)

	# 2 coordinate values
	elif len(lat) == 1 and len(lon) == 1:
		geo_dict = geo_point

	return geo_dict

def main():

	for k, v in tests.items():
		print(k)
		for line in v:
			key, value = slice_key_val(line)
			if key.lower() in geo_keys['lat']:
				lat.append(convert_num(value))
			elif key.lower() in geo_keys['lon']:
				lon.append(convert_num(value))
		geo_dict = create_coordinates(lat, lon)
		for k,v in geo_dict.items():
			print(k, v)

	return


main()
	








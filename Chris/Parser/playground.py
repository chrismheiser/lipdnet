__author__ = 'chrisheiser1'


acceptable_pairs = {"distance": ["m", "meters", "km", "kilometers", "ft", "feet"]}

def test_dict():
    acceptable_pairs['distance'].append('METERS')
    print(acceptable_pairs)


test_dict()
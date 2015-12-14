from geoChronR.Parser.doi.doi_resolver import *

__author__ = 'chrisheiser1'

"""
Purpose:

Changelog:
Version 1.1 / 12.09.2015 / Chris
Version 1.0 / ?? / Chris

Input:
Output:

    - Fix discrepancy with Published_Date vs. Published_Date_Or_year. Same thing?
    - Find out how to make better spacing in the chronology and data sections (have a fixed space of 5 characters?)

"""

# Pre-compiled Regexes
first_cap_re = re.compile('(.)([A-Z][a-z]+)')
all_cap_re = re.compile('([a-z0-9])([A-Z])')

# GLOBAL
# 13 is a list of keys to ignore when using create_blanks
sections = {1: ['onlineResource', 'studyName', 'archive', 'parameterKeywords', 'originalSourceUrl'],
            2: ['date'],
            3: ['studyName'],
            4: ['investigators'],
            5: ['description'],
            6: ['pub'],
            7: ['funding', 'agency', 'grant'],
            8: ['geo'],
            9: ['collectionName', 'earliestYear', 'mostRecentYear', 'timeUnit', 'coreLength', 'notes'],
            10: ['speciesName', 'commonName', 'treeSpeciesCode'],
            11: ['chronology'],
            12: ['paleoData'],
            13: ['funding', 'type', 'bbox', 'geo']}

# The order of the items in the list is the order that we want to write them to the file.
# 11 is the order for writing each column in the variables section
ordering = {1: ['studyName', 'onlineResource', 'originalSourceUrl', 'archive', 'parameterKeywords'],
            2: ['date'],
            3: ['studyName'],
            4: ['investigators'],
            5: ['description'],
            6: ['authors', 'publishedDateOrYear', 'publishedTitle', 'journalName', 'volume', 'edition', 'issue',
                'pages', 'doi', 'onlineResource', 'fullCitation', 'abstract'],
            7: ['agency', 'grant'],
            8: ['siteName', 'location', 'country', 'northernmostLatitude', 'southernmostLatitude',
                'easternmostLongitude', 'westernmostLongitude', 'elevation'],
            9: ['collectionName', 'earliestYear', 'mostRecentYear', 'timeUnit', 'coreLength', 'notes'],
            10: ['speciesName', 'commonName'],
            11: ['parameter', 'description', 'material', 'error', 'units', 'seasonality', 'archive', 'detail',
                 'method', 'dataType']}


class NOAA(object):

    def __init__(self, dir_root, name, root_dict):
        """
        :param dir_root: (str) Path to dir containing all .lpd files
        :param name: (str) Name of current .lpd file
        :param root_dict: (dict) Full dict loaded from jsonld file
        """
        self.dir_root = dir_root
        self.name = name
        self.root_dict = root_dict
        self.steps_dict = {1:{},2:{},3:{},4:{},5:{},6:{},7:{},8:{},9:{},10:{},11:{},12:{},13:{}}
        self.name_ext = name + '.txt'

    def start(self):
        """
        Load in the template file, and run through the parser
        :return:
        """

        # Create the output folder
        if not os.path.exists(os.path.join(self.dir_root, 'noaa_files')):
            os.makedirs(os.path.join(self.dir_root, 'noaa_files/'))

        # NOAA files are organized in sections, but jsonld is not. Reorganize to match NOAA template.
        for k, v in self.root_dict.items():
            self.steps_dict = self.reorganize(self.steps_dict, k, v)

        # Use data in steps_dict to write to
        self.write_file()

        return

    def write_file(self):
        """
        Final step. Takes all previous data and writes to txt file one section at a time.
        :return: none
        """

        noaa_txt = open(os.path.join('noaa_files', self.name_ext), "w+")

        self.write_top(noaa_txt, 1)
        self.write_generic(noaa_txt, 'Contribution_Date', 2)
        self.write_generic(noaa_txt, 'Title', 3)
        self.write_generic(noaa_txt, 'Investigators', 4)
        self.write_generic(noaa_txt, 'Description_Notes_and_Keywords', 5)
        self.write_pub(noaa_txt, 6)
        self.write_funding(noaa_txt, self.steps_dict[7])
        self.write_geo(noaa_txt, self.steps_dict[8])
        self.write_generic(noaa_txt, self.steps_dict[9], 'Data_Collection', 9)
        self.write_generic(noaa_txt, self.steps_dict[10], 'Species', 10)
        self.write_chron(self.name, noaa_txt, self.steps_dict[11])
        self.write_variables(noaa_txt, self.steps_dict[12])
        self.write_paleodata(self.name, noaa_txt, self.steps_dict[12])

        # Close the text file
        noaa_txt.close()
        return

    def write_top(self, noaa_txt, section_num):
        """
        Write the top section of the txt file.
        :param noaa_txt: (obj) Output .txt file that is being written to.
        :param section_num: (int) Section number
        :return: none
        """
        self.create_blanks(section_num)
        noaa_txt.write('# ' + self.steps_dict[section_num]['studyName'] + '\n\
            #-----------------------------------------------------------------------\n\
            #                World Data Service for Paleoclimatology, Boulder\n\
            #                                  and\n\
            #                     NOAA Paleoclimatology Program\n\
            #             National Centers for Environmental Information (NCEI)\n\
            #-----------------------------------------------------------------------\n\
            # Template Version 2.0\n\
            # NOTE: Please cite Publication, and Online_Resource and date accessed when using these data.\n\
            # If there is no publication information, please cite Investigators, Title, and Online_Resource\
            and date accessed.\n\
            # Online_Resource: ' +  self.steps_dict[section_num]['onlineResource'] + '\n\
            #\n\
            # Original_Source_URL: ' + self.steps_dict[section_num]['originalSourceUrl'] + '\n\
            #\n\
            # Description/Documentation lines begin with #\n\
            # Data lines have no #\n\
            #\n\
            # Archive: ' + self.steps_dict[section_num]['archive'] + '\n\
            #\n\
            # Parameter_Keywords: ' + self.steps_dict[section_num]['parameterKeywords'] + '\n\
            #--------------------\n')

        return

    def write_generic(self, noaa_txt, header, section_num):
        """
        Write a generic section to the .txt. This function is reused for multiple sections.
        :param noaa_txt: (obj) Output .txt file that is being written to.
        :param header: (str) Header title for this section
        :param section_num: (int) Section number
        :return: none
        """
        self.create_blanks(section_num)
        noaa_txt.write('# ' + header + ' \n')
        for entry in ordering[section_num]:
            if entry == 'coreLength':
                val, unit = self.get_corelength(self.steps_dict[section_num])
                noaa_txt.write('#   ' + self.underscore(entry) + ': ' + str(val) + ' ' + str(unit) + '\n')
            else:
                noaa_txt.write('#   ' + self.underscore(entry) + ': ' + str(self.steps_dict[section_num][entry]) + '\n')
        noaa_txt.write('#------------------\n')
        return

    def write_pub(self, noaa_txt, section_num):
        """
        Write pub section. There may be multiple, so write a generic section for each one.
        :param noaa_txt: (obj) Output .txt file that is being written to.
        :param section_num: (int) Section number
        :return: none
        """
        for key, pub_list in self.steps_dict[section_num].items():
            for pub in pub_list:
                self.write_generic(noaa_txt, 'Publication', 6)
        return

    def write_funding(self, file_out, dict_in):
        """

        :param file_out:
        :param dict_in:
        :return:
        """
        for key, fund_list in dict_in.items():
            for fund in fund_list:
                self.write_generic(file_out, fund, 'Funding_Agency', 7)
        return

    def write_geo(self, file_out, dict_in):
        """

        :param file_out:
        :param dict_in:
        :return:
        """
        for k, v in dict_in.items():
            dict_in = self.reorganize_geo(v)
        self.write_generic(file_out, dict_in, 'Site_Information', 8)
        return

    def write_chron(self, file_in, file_out, dict_in):
        """

        :param file_in:
        :param file_out:
        :param dict_in:
        :return:
        """
        file_out.write('# Chronology:\n#\n')

        if self.csv_found(file_in, 'chronology'):
            cols = dict_in['chronology']['columns']
            # Write variables line from dict_in
            for index, col in enumerate(cols):
                if index == 0:
                    file_out.write('#       ' + col['parameter'] + ' (' + col['units'] + ')  | ')
                elif index == len(cols)-1:
                    file_out.write(col['parameter'] + ' (' + col['units'] + ')\n')
                else:
                    file_out.write(col['parameter'] + ' (' + col['units'] + ')  | ')
            # Iter over CSV and write line for line
            with open(file_in + '-chronology.csv', 'r') as f:
                for line in iter(f):
                    line = line.split(',')
                    for index, value in enumerate(line):
                        if index == 0:
                            file_out.write('#          ' + str(value) + '              ')

                        elif index == len(line) - 1:
                            file_out.write(str(value))
                        else:
                            file_out.write(str(value) + '                 ')

        file_out.write('#------------------\n')

        return

    def write_variables(self, file_out, dict_in):
        """

        :param file_out:
        :param dict_in:
        :return:
        """
        cols = dict_in['paleoData'][0]['columns']
        file_out.write('# Variables\n\
    #\n\
    # Data variables follow that are preceded by "##" in columns one and two.\n\
    # Data line variables format:  Variables list, one per line, shortname-tab-longname-tab-longname components\
     ( 9 components: what, material, error, units, seasonality, archive, detail, method, C or N for Character or\
      Numeric data)\n#\n')
        for col in cols:
            for entry in ordering[11]:
                # Need TAB after a parameter
                if entry == 'parameter':
                    file_out.write('##' + col[entry] + '    ')
                # No space after last entry
                elif entry == 'dataType':
                    file_out.write(col[entry])
                # Space and comma after normal entries
                else:
                    file_out.write(col[entry] + ', ')
            file_out.write('\n')
        file_out.write('#\n#------------------\n')

        return

    def write_paleodata(self, file_in, file_out, dict_in):
        """

        :param file_in:
        :param file_out:
        :param dict_in:
        :return:
        """
        # Find out why noaa_to_lpd is not getting missing value
        file_out.write('# Data: \n\
    # Data lines follow (have no #) \n\
    # Data line format - tab-delimited text, variable short name as header) \n\
    # Missing_Values: ' + dict_in['paleoData'][0]['missingValue'] + '\n#\n')

        if self.csv_found(file_in, 'data'):
            # Write variables line from dict_in
            cols = dict_in['paleoData'][0]['columns']
            for col in cols:
                for entry in ordering[11]:
                    if entry == 'parameter':
                        file_out.write(col[entry] + '       ')
            file_out.write('\n')
            # Iter over CSV and write line for line
            with open(file_in + '-data.csv', 'r') as f:
                for line in iter(f):
                    line = line.split(',')
                    for index, value in enumerate(line):
                        if index == len(line) - 1:
                            file_out.write(str(value))
                        else:
                            file_out.write(str(value) + '   ')

        return

    def create_blanks(self, section_num):
        """
        All keys need to be written to the output, with or without a value. Furthermore, only keys that have values
        exist at this point. We need to manually insert the other keys with a blank value. Loop through the global list
        to see what's missing in our dict.
        :param section_num: (int) Retrieve data from global dict for this number.
        :return: none
        """
        for key in ordering[section_num]:
            if key not in self.steps_dict and key not in sections[13]:
                # Key not in our dict. Create the blank entry.
                self.steps_dict[key] = ''
        return

    @staticmethod
    def csv_found(self, filename, datatype):
        """
        Check for Chronology and Data CSVs
        :param filename: (str)
        :param datatype: (str)
        :return found: (bool) File found or not found
        """
        found = False

        # Attempt to open Data CSV
        try:
            if open(filename + '-' + datatype + '.csv'):
                found = True
                # print("{0} - found {1} csv".format(filename, datatype))
        except FileNotFoundError:
            # print("{0} - no {1} csv".format(filename, datatype))
            pass

        return found

    @staticmethod
    def underscore(self, key):
        """
        Convert camelCase to underscore
        :param key: (str) Key or title name
        :return s2: (str) Underscore formatted word
        """

        # Special keys that need a specific key change
        if key == 'doi':
            s2 = 'DOI'

        elif key == 'agency':
            s2 = 'Funding_Agency_Name'

        elif key == 'originalSourceURL':
            s2 = 'Original_Source_URL'

        # Use regex to split and add underscore at each capital letter
        else:
            s1 = first_cap_re.sub(r'\1_\2', key)
            s2 = all_cap_re.sub(r'\1_\2', key).title()

        return s2

    @staticmethod
    def split_path(self, string):
        """
        Used in the path_context function. Split the full path into a list of steps
        :param string: (str) Path string ("geo-elevation-height")
        :return out: (list) Path as a list of strings. One entry per path step.(["geo", "elevation", "height"])
        """
        out = []
        position = string.find(':')

        if position != -1:
            # A position of 0+ means that ":" was found in the string
            key = string[:position]
            val = string[position+1:]
            out.append(key)
            out.append(val)

            if ('-' in key) and ('Funding' not in key) and ('Grant' not in key):
                out = key.split('-')
                out.append(val)

        return out

    def path_context(self, flat_file):
        """
        Turns the flattened json list back in to a usable dictionary structure
        :param flat_file:
        :return:
        """

        new_dict = {}

        # Lists to recompile Values and Units
        elev = []
        core = []

        # Print out each item in the list for debugging
        for item in flat_file:
            split_list = self.split_path(item)
            lst_len = len(split_list)
            value = split_list[lst_len-1]

            if 'Latitude' in split_list:
                if 'Max' in split_list:
                    new_dict['Northernmost_Latitude'] = value

                elif 'Min' in split_list:
                    new_dict['Southernmost_Latitude'] = value

            elif 'Longitude' in split_list:
                if 'Max' in split_list:
                    new_dict['Easternmost_Longitude'] = value

                elif 'Min' in split_list:
                    new_dict['Westernmost_Longitude'] = value

            elif 'Elevation' in split_list:
                elev.append(value)

            elif 'CoreLength' in split_list:
                core.append(value)

            else:
                if len(split_list) > 2:
                    key = lst_len - 2
                    new_dict[split_list[key]] = value

                else:
                    new_dict[split_list[0]] = split_list[1]

        if core:
            new_dict['Core_Length'] = self.concat_units(core)
        if elev:
            new_dict['Elevation'] = self.concat_units(elev)

        return new_dict

    @staticmethod
    def get_corelength(self, dict_in):
        """
        Get the value and unit to write the Core Length line
        :param dict_in:
        :return val, unit:(int) Value (str) Unit
        """
        try:
            val = dict_in['coreLength']['value']
        except KeyError:
            val = ''
        try:
            unit = dict_in['coreLength']['unit']
        except KeyError:
            unit = ''
        return val, unit


    @staticmethod
    def coordinates(self, list_in, dict_temp):
        """
        Reorganize coordinates based on how many values are available.
        :param list_in: (list of float) Coordinate values
        :param dict_temp: (dict) Location with cooresponding values
        :return:
        """

        length = len(list_in)
        locations = ['northernmostLatitude', 'easternmostLongitude', 'southernmostLatitude', 'westernmostLongitude']

        if length == 0:
            for location in locations:
                dict_temp[location] = ' '
        elif length == 2:
            dict_temp[locations[0]] = list_in[0]
            dict_temp[locations[1]] = list_in[1]
            dict_temp[locations[2]] = list_in[0]
            dict_temp[locations[3]] = list_in[1]

        elif length == 4:
            for index, location in enumerate(locations):
                dict_temp[locations[index]] = list_in[index]

        return dict_temp

    def reorganize_geo(self, dict_in):
        """
        Concat geo value and units, and reorganize the rest
        :param dict_in:
        :return:
        """

        # The new dict that will be returned
        dict_temp = {}

        # Properties
        for k, v in dict_in['properties'].items():
            if k == 'elevation':
                dict_temp['elevation'] = str(v['value']) + ' ' + str(v['unit'])
            else:
                dict_temp[k] = v

        # Geometry
        dict_temp = self.coordinates(dict_in['geometry']['coordinates'], dict_temp)

        return dict_temp

    @staticmethod
    def reorganize(self, dict_in, key, value):
        """

        :param dict_in:
        :param key:
        :param value:
        :return:
        """

        # If the key isn't in any list, stash it in number 13 for now
        number = 13

        if key in sections[1]:
            # StudyName only triggers once, append to section 3 also
            if key == 'studyName':
                dict_in[3][key] = value
            number = 1
        elif key in sections[2]:
            number = 2
        elif key in sections[4]:
            number = 4
        elif key in sections[5]:
            number = 5
        elif key in sections[6]:
            number = 6
        elif key in sections[7]:
            number = 7
        elif key in sections[8]:
            number = 8
        elif key in sections[9]:
            number = 9
        elif key in sections[10]:
            number = 10
        elif key in sections[11]:
            number = 11
        elif key in sections[12]:
            number = 12
        dict_in[number][key] = value

        return dict_in





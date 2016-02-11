from Parser.modules.jsons import remove_empty_fields


class Flatten(object):
    """
    Flattens a nested, hierarchical dictionary into one or two levels.
    e.g. geo_properties_location:USA

    Input: (dict) JSON data
    Output: (list of str) Paths

    """

    def __init__(self, dict_in):
        self.dict_in = dict_in

    def run(self):
        current = []
        master = []
        final = self.dive(self.dict_in, current, master)
        final = remove_empty_fields(final)
        return final

    @staticmethod
    def count_dicts(list_in):
        """
        Count how many dictionaries are in a list
        :param list_in: (list)
        :return: (int)
        """
        count = 0
        for i in range(0, len(list_in)):
            if isinstance(list_in[i], dict):
                count += 1
        return count

    @staticmethod
    def count_strings(d):
        """
        Count number of strings in data structure
        :param d: (dict or list) Any data
        :return: (int) Number of string types
        """
        count = 0

        if isinstance(d, dict):
            for k, v in d.items():
                if isinstance(v, str) or isinstance(v, int) or isinstance(v, float):
                    count += 1
                elif isinstance(v, list):
                    for i in range(0, len(v)):
                        if isinstance(v[i], str):
                            count += 1

        elif isinstance(d, list):
            for i in range(0, len(d)):
                if isinstance(d[i], str) or isinstance(d[i], int) or isinstance(d[i], float):
                    count += 1

        return count

    def check_bottom(self, d):
        """
        Check if we're at the bottom of the nesting
        :param d: (dict or list) Data structure
        :return: (bool)
        """
        bottom = False
        items = len(d)
        count = self.count_strings(d)

        # If equal, then no more nesting. Reached the bottom.
        if count == items:
            bottom = True

        return bottom

    # POSSIBLY USELESS. MIGHT REMOVE
    @staticmethod
    def remove_empties(list_in):
        """
        Remove all the empty strings from the final list
        :param list_in: (list)
        :return: (list)
        """
        i = 0
        # ATTENTION: Make use of looping with enumerate here. More efficient and cleaner
        while i < len(list_in):
            if list_in[i] == "":
                list_in.remove("")
            i += 1
        return list_in

    @staticmethod
    def to_string(list_in):
        """
        Take the path list, and turn it into a path string
        :param list_in: (list)
        :return: (str)
        """

        if len(list_in) > 2:
            # Case 1: ['this', 'is', 'a', 'path'] becomes 'this_is_a:path'
            end = len(list_in) - 2
            path = list_in[:end]
            k_v = list_in[end:]
            path_join = '_'.join(map(str, path))
            k_v_join = ':'.join(map(str, k_v))
            return path_join + '_' + k_v_join

        # Case 2: ['this', 'is'] becomes 'this:is'
        return ':'.join(map(str, list_in))

    def append_one_item(self, v, current, overall):
        """
        ACCEPTS: dictionary(dict), current path (list), overall path (list) / RETURNS: None
        :param v:
        :param current:
        :param overall:
        :return:
        """
        current.append(v)
        temp = self.to_string(current)
        overall.append(temp)
        current.remove(v)
        return

    def append_two_items(self, k, v, current, overall):
        """
        If the item we have is a dead end, add the key-value to the current path
        Then, convert the path to a string, and add to the overall list of paths
        Then remove the key-value to preserve the current path.
        :param k: (str) Key
        :param v: (str) Value
        :param current: (list of str) One path broken up as a list
        :param overall: (list of str) All full paths
        :return: none
        """
        current.append(k)
        current.append(v)
        temp = self.to_string(current)
        overall.append(temp)
        current.remove(v)
        current.remove(k)
        return

    def dive(self, d, current, master):
        """
        Recursive dives down into the dictionary. Create paths as you go.

        :param d:
        :param current:
        :param master:
        :return: (list) Master
        """

        # Check if there are any more nested elements. i.e. at the bottom or not.
        bottom = self.check_bottom(d)

        # If we're at the bottom, clear the current path list at the end
        if bottom and ('columns' not in current):

            # ONE EXCEPTION TO BEING AT THE BOTTOM
            # If we are on the bottom AND in the ClimateInterp section, we need to remove "climateInterpretation"
            # from the current path after we're done, or it'll ruin the paths for the remaining measurement columns
            if (len(current) != 0) and (current[len(current) - 1] == 'climateInterpretation'):
                for k, v in d.items():
                    self.append_two_items(k, v, current, master)

                # Pop 'climateInterpretation' from our current path list
                current.pop()

            # If we're at the bottom for any other case, we can clear the whole current path
            else:
                for k, v in d.items():
                    self.append_two_items(k, v, current, master)

        # If we are not at the bottom, then add whatever current paths you can, and then make another dive
        else:
            # Iterate through all the strings, ints, and floats first, because they're the easiest and should be done
            # before diving again.
            for k, v in d.items():
                if isinstance(v, str) or isinstance(v, int) or isinstance(v, float):
                    self.append_two_items(k, v, current, master)

            # Next, unpack the dictionaries at this level.
            for k, v in d.items():
                if isinstance(v, dict):
                    current.append(k)
                    self.dive(v, current, master)
                    if k in current:
                        current.remove(k)

            # Lastly, unpack the lists at this level.
            for k, v in d.items():
                if isinstance(v, list):
                    current.append(k)

                    # Doing a bottom check for any lists that only have raw data
                    list_bottom = self.check_bottom(v)

                    # Maybe make a special case for the columns dict?? Don't clear the path until all done with cols ?
                    if k == 'columns':
                        columns = self.count_dicts(v)
                        for items in range(0, columns):
                            self.dive(v[items], current, master)
                        current.clear()

                    # If you have a list with raw data (no nesting), then do single appends on all its items.
                    elif list_bottom:
                        for item in range(0, len(v)):
                            self.append_one_item(v[item], current, master)
                        current.pop()

                    # When there are nested items in the list, keep diving into each item
                    else:
                        for item in range(0, len(v)):
                            # Appending a space for readability purposes
                            self.dive(v[item], current, master)

        return master



import csv


def getCSV(filename):
    """
    Opens the target CSV file and creates a dictionary with one list for each CSV column.
    :param filename: (str) Filename
    :return: (dict) CSV data
    """
    d = {}
    try:
        with open(filename, 'r') as f:
            r = csv.reader(f, delimiter=',')
            # Create a dict with X lists corresponding to X columns
            for idx, col in enumerate(next(r)):
                d[idx] = []
            # Start iter through CSV data
            for row in r:
                for idx, col in enumerate(row):
                    # Append the cell to the correct column list
                    d[idx].append(col)
    except FileNotFoundError:
        print('CSV: FileNotFound')
    return d


def writeCSV(filename):
    pass

import json
import re


def validation(list_in):

    lists = ["@context",
             "comments",
             "siteName",
             "collectionName",
             "geo-longitude-max",
             "geo-longitude-units",
             "geo-longitude-min",
             "geo-elevation-units",
             "geo-elevation-value",
             "geo-latitude-max",
             "geo-latitude-units",
             "geo-latitude-min",
             "pub-authors",
             "pub-year",
             "measurements-measTableName",
             "measurements-filename",
             "measurements-columns-column",
             "measurements-columns-dataType",
             "measurements-columns-shortName",
             "measurements-columns-longName",
             "measurements-columns-error",
             "measurements-columns-units",
             "measurements-columns-archive",
             "measurements-columns-method",
             "measurements-columns-material",
             "measurements-columns-error",
             "measurements-columns-climateInterpretation-parameterDetail",
             "measurements-columns-climateInterpretation-parameter",
             "measurements-columns-climateInterpretation-seasonality",
             "measurements-columns-climateInterpretation-basis",
             "measurements-columns-climateInterpretation-interpDirection"
    ]

    return

# Main method

def run():
    file = 'test_flat2.json'
    flat_json = open(file)
    data = json.load(flat_json)
    validation(data)

    return

run()
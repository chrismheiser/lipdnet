# ![LiPD Logo](https://www.dropbox.com/s/ywkm8kabznitzwf/favicon.png?raw=1) LiPD

LiPD DOI Resolver
------

Use Digital Object Identifier (DOI) names to fetch the most current online data for your records and update your local copies.

Overview
------

###### Input
```
LiPD file (.lpd)
```

###### Output
```
LiPD file (.lpd)
```

###### Choosing a target folder

The target folder must be set in the "main_doi.py" file before running the program. This target folder must contain the LiPD files (.lpd) that you wish to update.

Example:
```
Directory File Path (string)
/User/Documents/john/lpd_files
```
Locate "main()" function in the "main_doi.py" file, and replace dir_root with your directory file path. Directory file path must be in quotation marks.
```python
def main():
    """
    Main function that controls the script. Take in directory containing the .lpd file(s). Loop for each file.
    :return: None
    """
    # Take in user-chosen directory path
    dir_root = 'ENTER_FILE_PATH_HERE'

```

Changelog
------
Version 1.0 / 12.08.2015 / Chris

Installation
------
Refer to master README_lipd.md for installation information.

Contributors
------
The LiPD team. More information on the LiPD project can be found on the [LiPD website](www.lipd.net).

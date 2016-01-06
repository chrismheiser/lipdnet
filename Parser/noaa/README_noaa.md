# ![LiPD Logo](https://www.dropbox.com/s/tnt1d10vwx4zlla/lipd_rm_trans.png?raw=1) LiPD

NOAA Converter
------
Convert between NOAA and LiPD file formats. NOAA to LiPD, and LiPD to NOAA.

Overview
------

###### Input
```
LiPD file (.lpd) or NOAA text (.txt)
```

###### Output
```
LiPD file (.lpd) or NOAA text (.txt)
```

###### Choosing a target directory

The target directory must be set in the "main_noaa.py" file before running the program. This target directory must contain the LiPD or NOAA files that you wish to convert.

Example:
```
Directory Path
/User/Documents/Antarctica/lpd_files
```
Locate "main()" function in the "main_noaa.py" file, and replace dir_root with your directory path.

Before:
```python
def main():

    # Enter user-chosen directory path
    dir_root = 'ENTER_DIRECTORY_PATH_HERE'

```
After:
```python
def main():

    # Enter user-chosen directory path
    dir_root = '/User/Documents/Antarctica/lpd_files'

```

Changelog
------
Version 1.0 / 12.09.2015 / Chris

Installation
------
Refer to master README_lipd.md for installation information.

Contributors
------
The LiPD team. More information on the LiPD project can be found on the [LiPD website](www.lipd.net).

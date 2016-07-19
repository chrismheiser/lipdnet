# Make sure the file is properly bagged
# Load in the JSON
# Check for LiPD Version number
# Handle based on which version is found
# Add MD5 to json for each file in the zip


# How to call python script from R. Basic.
py.call <- function(){
  # Note: make sure there is a blank line at end of python script
  library(rPython)
  python.load("hello.py")
}

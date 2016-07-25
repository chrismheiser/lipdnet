###############################################
## LiPD Verification Tasks
###############################################


# Check the LiPD version of a file
check.lipd.version <- function(D){

  # Get value as character, not numeric
  ver <- as.character(D$LiPDVersion)
  print(ver)
  # A version number is 1.0, or wasn't found
  if (ver == "1.0"| is.null(ver)){
    d <- import.1.0(D)
  }
  else if (ver == "1.1"){
    d <- import.1.1(D)
  }
  else if (ver == "1.2"){
    d <- import.1.2(D)
  }
  return(ver)
}

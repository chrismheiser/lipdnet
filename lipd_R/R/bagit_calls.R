###############################################
## Bagit Calls
##
## An R layer that uses rPython to makes calls
## to the python bagit module. Cross-language
## functionality.
###############################################



#' Since we don't have a way of getting the bagit module in R,
#' all we can do is use the default bag function by calling the
#' full python file on a directory. This will create a bag.
#' @export
#' @param path The path to the directory that needs to be bagged
#' @return none
bagit <- function(path){
  # path is the tmp directory at LiPD folder level
  bagitPath="~/R/bagit.py"
  datadir <- paste0(path, "/data")
  setwd(outdir)
  # do a system call for bagit on the tmp folder
  system(paste0(bagitPath, " ", datadir))
}


# Check that bag is valid
validate.bag <- function(bag){

}

# Create bag from LiPD directory
create.bag <- function(){

}

# Open bag given LiPD directory
open.bag <- function(){

}

# Create, open, and save bag
close.bag <- function(){

}

# Check bag.info for DOI resolved flag true/false
doi.resolved.flag <- function(){

}


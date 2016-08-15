#' Zip a directory, and move up a level
#' @export
#' @param dir Directory to be zipped
#' @param tmp Directory that holds resulting zip file
#' @return none
zipper <- function(dir, tmp){
  # zip the top lipd directory. zip file is create one level up
  setwd(dir)
  include.files <- list.files(getwd(), recursive = TRUE)
  suppressAll(zip(dir, include.files))
  setwd(tmp)
}

#' Since we don't have a way of getting the bagit module in R,
#' all we can do is use the default bag function by calling the
#' full python file on a directory. This will create a bag.
#' @export
#' @param path The path to the directory that needs to be bagged
#' @return none
bagit <- function(data.dir, initial.dir){
  # check for bagit.py in case they're working in the package folder
  bagit.script <- file.path(initial.dir, "R", "bagit.py")
  if(!file.exists(bagit.script)){
    print("Select your bagit.py file")
    bagit.script=file.choose()
  }
  Sys.chmod(bagit.script, "777")
  # do a system call for bagit on the tmp folder
  ret <- system(paste0(bagit.script, " ", data.dir), ignore.stdout = TRUE, ignore.stderr = TRUE)
  # do soft bagit if system call status returns 1 (error)
  if (ret == 1){
    return(FALSE)
  }
  return(TRUE)
}

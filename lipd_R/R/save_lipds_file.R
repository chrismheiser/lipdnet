#' Main function. Run all save sub-routines for one LiPD record
#' @export
#' @param name Name of current LiPD record
#' @param d Metadata
#' @return none
save.lipd.file <- function(name, d){

  # Create the folder hierarchy for Bagit
  # Make the tmp folder and move into it
  initial.dir <- getwd()
  tmp <- create.tmp.dir()
  setwd(tmp)

  # Remove the lipd dir if it already exists
  if (dir.exists(name)){
    unlink(name, recursive=TRUE)
  }

  # Create a lipd dir
  dir.create(name, showWarnings=FALSE)
  lipd.dir <- file.path(tmp, name)
  setwd(name)

  # Need an extra (identical) level for zipping later.
  dir.create(name, showWarnings=FALSE)
  lipd2.dir <- file.path(tmp,name,name)
  setwd(name)

  # reverse columns to index by number
  d <- index.by.number(d)

  # collect all csv data into an organized list
  all.data <- collect.csvs(name, d)

  # use the organized list to write out all csv files
  write.csvs(all.data[["csv"]])

  # remove all empty objs and null values
  j <- remove.empty.rec(all.data[["metadata"]])

  # turn data structure into json
  j <- toJSON(j, pretty=TRUE, auto_unbox = TRUE)

  # filename.lpd
  lpd.jsonld <- paste0(name, ".jsonld")

  # write json to file
  write(j, file=lpd.jsonld)

  # move up to lipd dir level
  setwd(lipd2.dir)

  # bag the lipd directory
  # lipd directory is lipd name without extension
  bagit(lipd2.dir, initial.dir)

  # zip the top lipd directory. zip file is create one level up
  setwd(lipd.dir)
  include.files <- list.files(getwd(), recursive = TRUE)
  zip(lipd.dir, include.files)
  setwd(tmp)

  # rename the file
  name.zip <- paste0(name, ".zip")
  name.lpd <- paste0(name, ".lpd")
  if (file.exists(name.zip)){
    file.rename(name.zip, name.lpd)
  }

  # move file to initial directory
  if(file.exists(name.lpd)){
    file.copy(name.lpd, initial.dir, overwrite=TRUE)
  }

  return()
}


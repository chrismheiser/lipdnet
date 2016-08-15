###############################################
## Load LiPD files
## The main part of loading the the data to
## memory
###############################################

#' Import the data from each csv and jsonld file for given LiPDs
#' @export
#' @param tmp Char path to the temp folder in memory
#' @param files_noext List of lipd files without extention
#' @return out.list List of data for each lipd file
load.lipd.files <- function(tmp, files_noext){

  # Move into the tmp folder
  setwd(tmp)

  out.list <- list()
  file.count <- length(files_noext)

  for(i in 1:file.count){
    current <- files_noext[[i]]
    setwd(current)
    print(sprintf("loading: %s", current))

    # real bagit. move into data folder
    if (dir.exists("data")){ setwd("data") }

    # fake bagit. no data folder. all files in root dir.
    data.list <- get.data()

    # compiled list of all data
    out.list[[files_noext[[i]]]] <- data.list

    # Move back up to the tmp directory
    setwd(tmp)
  }
  return(out.list)
}

#' Retrieve and import csv and jsonld files in the current directory.
#' @export
#' @return data.list List of data for one LiPD file
get.data <- function(){
  data.list <- list()
  # list of csv files
  c <- get.list.csv()
  # csv data placeholder
  c.data=vector(mode="list",length=length(c))
  # import each csv file
  for (ci in 1:length(c)){
    df=import.file.csv(c[ci])
    c.data[[c[ci]]]=df
  }

  # jsonld file - one per lpd
  j <- get.list.jsonld()
  # import jsonld file
  j.data <- import.file.jsonld(j)

  # combine data for return.
  data.list[["metadata"]] <- j.data
  data.list[["csv"]] <- c.data
  return(data.list)
}

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

    # Move into the data folder if it exists
    if (dir.exists("data")){
      data.list <- list()
      setwd("data")

      # Get all CSV files and data. Combined
      c <- get.list.csv()
      c.data=vector(mode="list",length=length(c))
      for (ci in 1:length(c)){
        df=import.file.csv(c[ci])
      c.data[[c[ci]]]=df
      }

      # Get all JSONLD files and data. Combined
      j <- get.list.jsonld()
      j.data <- import.file.jsonld(j)

      # Append the JSONLD and CSV data together
      # out <- append(j.data, c.data)
      data.list[["metadata"]] <- j.data
      data.list[["csv"]] <- c.data
    }

    out.list[[files_noext[[i]]]] <- data.list
    # Move back up to the tmp directory
    setwd(tmp)
  }

  return(out.list)
}

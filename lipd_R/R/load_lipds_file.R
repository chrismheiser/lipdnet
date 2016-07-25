###############################################
## Load LiPD files
## The main part of loading the the data to
## memory
###############################################

# Import lipd data
import.file.lipd <- function(tmp, files_noext){

  # Move into the tmp folder
  setwd(tmp)

  out.list <- list()
  file.count <- length(files_noext)

  for(i in 1:file.count){
    current <- files_noext[[i]]
    setwd(current)

    # Move into the data folder if it exists
    if (dir.exists("data")){
      data.list <- list()
      setwd("data")

      # Get all CSV files and data. Combined
      c <- get.list.csv()
      c.data <- sapply(c, function(x){
        datas <- import.file.csv(x)
        return(datas)
      })

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

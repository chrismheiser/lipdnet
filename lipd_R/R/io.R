#' Batch lipd import
#'
#'  Reads in all .lipd files from the given directory, and loads them into a data frame
#' @param x character. Directory that contains .lipd files.
#' @return One list of data frames for each lipd file
#' @export

import.lipds <- function(){
  curr.dir <- getwd()
  files <- list.files(path=curr.dir, pattern='\\.lpd$')
  dfs <- sapply(files,
                      function(f){
                        df <- unzip.lipd(f)
                        return(df)
                      }
  )
  return(dfs)
}

#' Unzip module
#'
#'  Take in a LiPD file and unzip it. Make contents available
#' @param x. LiPD file
#' @return Contents of LiPD file
#' @export

unzip.lipd <- function(zipfile){
  # Save the root dir before we start changing locations
  cdir <- getwd()

  # Create a name for the dir where we'll unzip
  zipdir <- tempfile()

  # Create the dir using that name
  dir.create(zipdir)

  # Unzip the file into the dir
  unzip(zipfile, exdir=zipdir)

  # Get a list of files in the dir
  all.files <- list.files(zipdir, rec=TRUE)
  csv.files <- list.files(zipdir, rec=TRUE, pattern="\\.csv$")
  json.files <- list.files(zipdir, rec=TRUE, pattern="\\.json$|\\.jsonld$")

  # Move into the temp directory
  setwd(zipdir)

  json.data <- import.json(json.files)
  csv.data <- import.csv(csv.files)
  df <- data.frame(json.data, csv.data)

  # Go back to top directory
  setwd(cdir)

  # Return data
  return(df)
}


#'
#'
#'
#'
import.csv <- function(files){
  # Create a list of the imported csv files
  csv.data <- sapply(files,
                      function(f){
                        fp <- file.path(".", f)
                        dat <- read.csv(fp)
                        return(dat)
                      }
  )
  return(csv.data)
}

#'
#'
#'
#'
import.json <- function(files){
  # Create a list of the imported json files
  json.data <- sapply(files,
                      function(f){
                        fp <- file.path(".", f)
                        dat <- fromJSON(file = fp)
                        return(dat)
                        }
                      )
  return(json.data)

}


#' Output lipd data to file
#'
#'  Outputs the lipd files in the current directory
#' @return
#' @export
#'
output.lipds <- function(){
  curr_path <- getwd()
  out_path <- paste0(curr_path,'/output')
  if (dir.create(out_path, showWarnings = FALSE)){
    dir.create(out_path, mode = "0777", showWarnings = FALSE, recursive = FALSE)
  }
  setwd(out_path)
  print(getwd())
  count <- 1
  for (file in x){
    filename <- names(x[count])
    output_file <- paste0(filename, '.lipd')
    writeLines(toJSON(file, pretty=TRUE, byrow=TRUE), output_file)
    count <- count + 1
  }
  setwd(curr_path)
}

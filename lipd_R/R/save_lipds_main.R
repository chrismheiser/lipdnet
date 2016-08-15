#' Main function. Loop through all LiPD records, saving, and then cleaning up
#' @export
#' @param D LiPD Library
#' @return none
save.lipds <- function(D){

  # starting directory. this is where files will be saved to
  initial.dir <- getwd()

  # Parse one or many records?
  if ("paleoData" %in% names(D)){
    single.parse(D)
  } else {
    multi.parse(D)
  }

  # return back to the initial directory
  setwd(initial.dir)
}

#' Parse one data record
#' @export
#' @param d LiPD data
#' @param name Data set name
#' @return none
single.parse <- function(d, name=NA){
  # save one lipd
  if (is.na(name)){
    name <- get.datasetname(d)
  }
  print(sprintf("saving: %s", name))
  # Save lipd data
  save.lipd.file(d, name)
}

#' Parse library of data records
#' @export
#' @param D LiPD data
#' @return none
multi.parse <- function(D){
  # loop by record names
  lpds <- names(D)

  for (i in 1:length(lpds)){
    # reference to single lipd record
    d <- D[[lpds[[i]]]]
    single.parse(d, lpds[[i]])
  }
}

#' Get data set name from metadata
#' @export
#' @param d LiPD data
#' @return name Data set name
get.datasetname <- function(d){
  # Attempt to find data set name entry
  name <- tryCatch({
    name <- d$dataSetName
  }, error=function(cond){
    return(NA)
  })
  # No dataSetName entry in record. Have user enter a name
  if (is.na(name)){
    name <- prompt.string("No data set name found. Enter the name: ")
  }
  return(name)
}

#' Prompt the user for some string entry
#' @export
#' @param statement Statement that gets printed to the user
#' @return ans User input entry
prompt.string <- function(statement){
  invalid = TRUE
  # Loop until valid input
  while (invalid){
    ans <- readline(prompt=statement)
    ans <- as.character(ans)
    if (ans != ""){
      # Valid input. Stop looping
      invalid = FALSE
    }
  }
  return(ans)
}

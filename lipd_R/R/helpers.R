#' Remove all NA, NULL, and empty objects from the data structure
#' @export
#' @param x Data structure
#' @return x Modified data structure
remove.empty.rec <- function( x ){
  # don't process matrices. it'll turn them to lists and that ruins ensemble data.
  if (!is.matrix(x)){
    # Remove all the nulls
    x <- x[ !is.NullOb( x )]
    x <- x[ !is.na( x ) ]
    x <- x[ !sapply( x, is.null ) ]
    # Recursion
    if( is.list(x) ){
      # Recursive dive
      x <- lapply(x, remove.empty.rec)
    }
    x <- x[ unlist(sapply(x, length) != 0)]
  }
  return(x)
}

#' Checks if an object is null/empty
#' @export
#' @param x Data object to check
#' @return boolean
is.NullOb <- function(x) is.null(x) | all(sapply(x, is.null))


#' Create a temporary working directory
#' @export
#' @return d Temporary directory path
create.tmp.dir <- function(){
  d <- tempdir()
  return(d)
}

#' Return to preset "home" working directory
#' @return none
return.to.root <- function(){
  if(!exists("working.dir",where = .GlobalEnv)){
    print("Working directory not set. Choose any file -inside- your target directory")
    out <- gui.for.path(NULL)
    working.dir <- out[["dir"]]
    assign("working.dir", working.dir, envir = .GlobalEnv)
  }
  setwd(working.dir)
}

#' Check if metadata path exists. Combine path and i to check for existence
#' @export
#' @param path Path in metadata
#' @param i Next path level.
#' @return dat Data found or null
has.data <- function(path, i){
  dat <- tryCatch({
    dat <- path[[i]]
  }, error=function(cond){
    return(NULL)
  })
  return(dat)
}

#' Replace all blank values in csv matrices
#' @export
#' @param csv All csv data
#' @return csv All csv data
clean.csv <- function(csv){
  blanks <- c("", " ", "NA")
  for (file in 1:length(csv)){
    for (cols in 1:length(csv[[file]])){
      # get one column (matrix)
      col <- csv[[file]][[cols]]
      # replace all blanks in it
      col[col %in% blanks] <- NA
      # set column back in columns
      csv[[file]][[cols]] <- col
    }
  }
  return(csv)
}

#' Check if output filename has invalid filename characters. Replace if necessary
#' R will not zip directories with certain characters.
#' @export
#' @param x String
#' @return x String
verify.name <- function(x){
  x <- gsub("[.]", "-", x)
  return(x)
}

###############################################
## Load LiPD - Helpers
## Misc functions that aid the loading of LiPD
## files
###############################################

#' Import each of the required modules for the package
#' @export
#' @return none
set.modules <- function(){
  suppressPackageStartupMessages(library(tools, quietly=TRUE, verbose=FALSE))
  suppressPackageStartupMessages(library(Kmisc, quietly=TRUE, verbose=FALSE))
  suppressPackageStartupMessages(library(RJSONIO, quietly=TRUE, verbose=FALSE))
  suppressPackageStartupMessages(library(jsonlite, quietly=TRUE, verbose=FALSE))
  suppressPackageStartupMessages(library(BBmisc, quietly=TRUE, verbose=FALSE))
}

#' Ask user where local file/folder location is.
#' @export
#' @return path.and.file Path to files
get.local.path <- function(){
  ans <- ask.how.many()
  path.and.file <- gui.for.path(ans)
  return(path.and.file)
}


#' Get list of all LiPD files in current directory
#' @export
#' @param path.and.file Target directory and 1+ files
#' @return f List of LiPD files w. ext
get.list.lpd.ext <- function(path.and.file){
  file <- path.and.file[["file"]]
  # Multiple file grab. No single filename given.
  if (is.null(file)){
    f <- list.files(path=getwd(), pattern='\\.lpd$')
  }
  # Single file given. Create list of one filename.
  else {
    f <- list()
    f[[1]] <- file
  }
  return(f)
}


#' Unzip all LiPD files to the temporary directory
#' @export
#' @param files LiPD files to unzip
#' @param tmp Temporary directory
#' @return none
unzipper <- function(files, tmp){
  if(length(files)>0){
    sapply(files, function(f){
      unzip(f, exdir = tmp)
    })
  }
}

#' Remove the file extension from string names
#' @export
#' @param files_ext List of LiPD filenames w. ext
#' @return x LiPD filename
strip.extension <- function(files_ext){
  x <- sapply(files_ext, function(f){
    strip_extension(f)
  })
  x <- as.character(x)
  return(x)
}

#' Get list of csv files in current directory and below
#' @export
#' @return f List of csv files
get.list.csv <- function(){
  f <- list.files(path=getwd(), pattern='\\.csv$', recursive=TRUE)
  return(f)
}

#' Get list of jsonly files in current directory and below
#' @export
#' @return f List of jsonld files
get.list.jsonld <- function(){
  f <- list.files(path=getwd(), pattern='\\.jsonld$', recursive=TRUE)
  return(f)
}

#' Read in data from a csv file
#' @export
#' @param f Target file
#' @return t Data frame of csv data
import.file.csv <- function(f){
  t <- read.csv(f, header=FALSE)
  # convert data frame to list
  t <- as.list(t)
  # convert columns from ANY type to numeric
  for (i in 1:length(t)){
    t[[i]] <- as.numeric(t[[i]])
  }
  return(t)
}

#' Read in data from a jsonld file
#' @export
#' @param f Target file
#' @return l List of jsonld data
import.file.jsonld <- function(f){
  l <- fromJSON(f, simplifyDataFrame = FALSE)
  return(l)
}

#' Remove CSV and metadata layer from our lipd library. Also, remove empties
#' @export
#' @param D LiPD Library
#' @param lpds List of LiPD files in the library
#' @return D Modified lipd library
remove.layers <- function(D, lpds){
  for (i in 1:length(lpds)){
    name <- lpds[[i]]
    new.meta <- remove.empty.rec(D[[name]][["metadata"]])
    D[[name]] <- new.meta
  }
  return(D)
}

#' Ask if user wants to load one file or a directory with multiple files.
#' @export
#' @return ans Answer to prompt (s/m)
ask.how.many <- function(){
  ans <- readline(prompt="Are you loading one file or multiple? (s/m): ")
  # Test if input matches what we expect. Keep prompting until valid input.
  if(!grepl("\\<s\\>",ans) & !grepl("\\<m\\>", ans))
  { return(ask.how.many()) }
  # Return a valid answer
  return(as.character(ans))
}


#' Open a file browsing gui to let the user pick a location
#' @export
#' @param ans Single or multiple files
#' @return path Path to file
gui.for.path <- function(ans){
  tryCatch(
    { path <- file.choose() },
  error=function(cond){
    print("File/Directory not chosen")
    quit(1)
    })

  # parse the dir path. don't keep the filename
  if (ans == "m" | is.null(ans)){
    dir.path = dirname(path)
    one.file = NULL
  }
  # parse the dir path and the filename
  else if (ans == "s"){
    dir.path = dirname(path)
    one.file = basename(path)
  }
  out.list <- list("dir" = dir.path, "file"= one.file)
  return(out.list)
}

#' Convert column type: data frame to list
#' @export
#' @param table Data table
#' @return table Converted data table
cols.to.lists <- function(table){
  meta.list <- list()

  # columns are at index 1
  cols <- table[[1]][["columns"]][[1]]

  # loop over dim
  for (i in 1:dim(cols)){
    #make it a list
    meta.list[[i]]=as.list(cols[i,])
  }
  # insert new columns
  table[[1]][["columns"]] <- meta.list

  return(meta.list)
}

#' Convert table type: data frame to list
#' @export
#' @param table Data table
#' @return table Converted data table
table.to.list <- function(table){

  # convert table index
  if (is.dataframe(table[[1]])){
    table <- as.list(table[[1]])
  }
  # convert table
  if (is.dataframe(table)){
    table <- as.list(table)
  }
  return(table)
}




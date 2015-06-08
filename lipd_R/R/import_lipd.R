#' Batch lipd import
#'
#'  Reads in all .lipd files from the given directory, and loads them into a data frame
#' @param x character. Directory that contains .lipd files.
#' @return One list of data frames for each lipd file
#' @export

batch_files <- function(x){
     files <-  list.files(path=x, pattern='*.lipd')
     frames <- lapply(files, function(x) fromJSON(x))
     return(frames)
}

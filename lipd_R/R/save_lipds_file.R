
save.lipd.file <- function(name, d){

  # reverse columns to index by number
  d <- index.by.number(d)

  # write csv to files
  write.csvs(d)

  # remove csv from metadata
  d <- remove.csvs(d)

  # turn data structure into json
  j <- toJSON(d, pretty=TRUE, auto_unbox = TRUE)

  # filename.lpd
  lpd_ext <- paste(filename, ".jsonld")

  # write json to file
  write(j, file=filename)

  # bag the temp directory
  bagit(tmp)

  # move .lpd to inital directory

}

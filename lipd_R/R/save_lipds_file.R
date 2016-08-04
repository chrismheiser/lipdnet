
save.lipd.file <- function(name, d){

  # reverse columns to index by number
  d <- index.by.number(d)

  # collect all csv data into an organized list
  all.data <- collect.csvs(name, d)

  # use the organized list to write out all csv files
  write.csvs(all.data[["csv"]])

  # turn data structure into json
  j <- toJSON(all.data[["metadata"]], pretty=TRUE, auto_unbox = TRUE)

  # filename.lpd
  lpd_ext <- paste(filename, ".jsonld")

  # write json to file
  write(j, file=filename)

  # bag the temp directory
  bagit(tmp)

  # zip the tmp directory

  # move the zip into the initial directory

  # remove the tmp folder in the tmp directory

}

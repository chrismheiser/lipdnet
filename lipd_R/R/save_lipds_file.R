#' Main function. Run all save sub-routines for one LiPD record
#' @export
#' @param d Metadata
#' @param name Name of current LiPD record
#' @return none
save.lipd.file <- function(d, name){

  # verify name format
  name <- verify.name(name)

  # Create the folder hierarchy for Bagit
  # Make the tmp folder and move into it
  initial.dir <- getwd()
  tmp <- create.tmp.dir()
  if (!dir.exists(tmp)){
    dir.create(tmp)
  }
  setwd(tmp)

  # Remove the lipd dir if it already exists
  if (dir.exists(name)){
    unlink(name, recursive=TRUE)
  }

  # Create a lipd dir
  dir.create(name, showWarnings=FALSE)
  lipd.dir <- file.path(tmp, name)
  setwd(name)

  # Need an extra (identical) level for zipping later.
  dir.create(name, showWarnings=FALSE)
  lipd2.dir <- file.path(tmp,name,name)
  setwd(name)

  # reverse columns to index by number
  d <- index.by.number(d)

  # collect all csv data into an organized list
  all.data <- collect.csvs(name, d)

  # clean csv
  all.data[["csv"]] <- clean.csv(all.data[["csv"]])

  # use the organized list to write out all csv files
  csv.success <- write.csvs(all.data[["csv"]])

  # only continue if csv files were written
  if (csv.success){
    # remove all empty objs and null values
    j <- remove.empty.rec(all.data[["metadata"]])

    # turn data structure into json
    j <- toJSON(j, pretty=TRUE, auto_unbox = TRUE)

    # filename.lpd
    lpd.jsonld <- paste0(name, ".jsonld")

    # write json to file
    write(j, file=lpd.jsonld)

    # move up to lipd dir level
    setwd(lipd2.dir)

    # bag the lipd directory
    # lipd directory is lipd name without extension
    bag.success <- bagit(lipd2.dir, initial.dir)
    # if bagit success, zip the lipd.dir. if bagit failed, zip lipd.dir2
    if (bag.success){
      zipper(lipd.dir, tmp)
    } else if (!bag.success){
      zipper(lipd.dir2, lipd.dir)
    }

    # rename the file
    name.zip <- paste0(name, ".zip")
    name.lpd <- paste0(name, ".lpd")
    if (file.exists(name.zip)){
      file.rename(name.zip, name.lpd)
    }

    # move file to initial directory
    if(file.exists(name.lpd)){
      file.copy(name.lpd, initial.dir, overwrite=TRUE)
    }

  } # end csv.success

  # remove the tmp folder and contents
  unlink(tmp, recursive=TRUE)

  # return back to the initial directory
  setwd(initial.dir)

}



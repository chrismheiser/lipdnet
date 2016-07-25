###############################################
## Load Lipds - wrapper
## Combines all the file loading functions
## into one process
###############################################

load.lipds <- function(){

  # Do initial set up
  initial_dir <- getwd()
  set.modules()
  tmp <- create.tmp.dir()

  # Get names of lipd files present
  lpds_ext <- get.list.lpd.ext()
  print(lpds_ext)
  lpds <- strip.extension(lpds_ext)

  # Unzip the lipd files to the temp workspace
  unzipper(lpds_ext, tmp)

  # Start importing data from the unpacked temp workspace
  ls <- import.file.lipd(tmp, lpds)

  # Convert metadata structure to newest LiPD version
  ls <- convert.version(ls)

  # Convert data types whereever necessary
  # ls <-convert.data.types(ls)

  # Now you have all the data loaded in memory, place data from csv into columns
  # ls <- merge.data.lipd(ls)

  # TODO: Change columns and tables to index-by-name

  # Move back to the inital directory (Prior to temp folder)
  setwd(initial_dir)

  # Return the "LiPD Library" (list) of compiled, imported data
  return(ls)
}

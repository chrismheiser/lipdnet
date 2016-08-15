###############################################
## Load Lipds - wrapper
## Combines all the file loading functions
## into one process
###############################################

#' Main LiPD loading function. Combines all processes into one.
#' @export
#' @return D LiPD Library
load.lipds <- function(){
  set.modules()
  options( warn = -1 )

  # Ask user where files are stored
  path.and.file <- get.local.path()

  # Do initial set up
  initial.dir <- path.and.file[["dir"]]
  setwd(initial.dir)
  tmp <- create.tmp.dir()

  # Get names of lipd files present
  lpds_ext <- get.list.lpd.ext(path.and.file)
  lpds <- strip.extension(lpds_ext)

  # Unzip the lipd files to the temp workspace
  unzipper(lpds_ext, tmp)

  # Start importing data from the unpacked temp workspace
  D <- load.lipd.files(tmp, lpds)

  # Convert metadata structure to newest LiPD version
  D <- convert.version(D)

  # Now you have all the data loaded in memory, place data from csv into columns
  D <- merge.main(D, lpds)

  # Change columns and tables to index-by-name
  D <- index.by.name(D, lpds)

  # We no longer need the csv and metadata separate parts. Link straight to the data.
  D <- remove.layers(D, lpds)

  # If there's only one lpds object in D, move it to the front
  if(length(D)==1){
    D <- D[[1]]
  }

  # Move back to the inital directory (Prior to temp folder)
  setwd(initial.dir)

  return(D)
}

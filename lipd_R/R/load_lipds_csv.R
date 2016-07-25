###############################################
## Load LiPDs - Merge
## Merge metadata and csv into one LiPD object
###############################################

merge.data.lipd <- function(D){
  file.count <- length(D)
  for (i in 1:file.count){
    metadata.count <- length(D[["metadata"]])
    for (i in 1:metadata.count){
      # Call once for paleoData

      # Call once for chronData

      # Return the new data

    }
  }
}


# These two functions will be identical except for the "paleo" and "chron" name differences.
merge.paleodata <- function(){


}

merge.chrondata <- function(){

}

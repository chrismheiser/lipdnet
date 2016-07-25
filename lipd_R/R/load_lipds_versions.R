###############################################
## Load LiPDs - Versions
## Converts the incoming LiPD data into the
## current LiPD version structure
###############################################

# Main function
convert.version <- function(D){
  # Loop once for every LiPD object
  for (i in 1:length(D)){
    # Check which version this LiPD file is
    current <- D[[i]]
    version <- get.version(current)

    # Handle version conversion appropriately
    # if (version == 1.0){
    #   current <- convert.1.0(current)
    #   version <- 1.1
    #   print(sprintf("lipd version: %s", version))
    #
    # }
    # if (version == 1.1){
    #   current <- convert.1.1(current)
    #   version <- 1.2
    #   print(sprintf("lipd version: %s", version))
    #
    # }
    # if version == 1.2, then it's the most recent and conversion is not needed.

    # check and convert any data frames into lists
    current <- convert.dfs2lst(current)

    # Replace the LiPD data with the new converted structure
    D[[i]] <- current
  }
  return(D)
}


# Get the version number from metadata
get.version <- function(d){
  version <- as.numeric(d[["metadata"]][["LiPDVersion"]])
  if (length(version)==0){
    version <- 1.0
  }
  else if (version != 1.1 & version != 1.2){
    print("LiPD Version is invalid")
  }
  return(version)
}

# Convert chron from a single fixed table, so a multiple scalable table
# (LiPD Verison 1.0 to 1.1 change)
convert.chron.s2m <- function(d){

  # Notable change 1.0 to 1.1:
  # chronData goes from single-fixed structure to multiple-variate structure
  o <- list()

  # save the data
  backup <- d[["metadata"]][["chronData"]]

  # Make sure data exists
  if (!is.null(backup)){

    # If there is not data where it should be, it's the wrong format
    if (is.null(d[["metadata"]][["chronData"]][[1]][["chronMeasurementTable"]][[1]])){
      # create the nested measurement table
      l <- list()
      mt <- list()
      mt["chronMeasurementTable"] <- l
      mt[["chronMeasurementTable"]][[1]] <- backup

      # remove paleodata from the metadata
      d[["metadata"]][["chronData"]] <- NULL

      # place paleodata back in lipd object as a list at index 1
      d[["metadata"]][["chronData"]] <- list()
      d[["metadata"]][["chronData"]][[1]] <- mt

      # change the LiPDVersion value to 1.1
      d[["metadata"]][["LiPDVersion"]] <- 1.1
    }
  }
  return(d)
}

# Convert paleo from a single fixed table, so a multiple scalable table
# (LiPD Verison 1.1 to 1.2 change)
convert.paleo.s2m <- function(d){

  # Notable change 1.1 to 1.2:
  # paleoData goes from single-fixed structure to multiple-variate structure
  o <- list()

  # save the value as a paleoMeasurementTable
  backup <- d[["metadata"]][["paleoData"]]

  # Make sure data exists
  if (!is.null(backup)){

    # If there is not data where it should be, it's the wrong format
    if (is.null(d[["metadata"]][["paleoData"]][[1]][["paleoMeasurementTable"]][[1]])){

      # create the nested measurement table
      l <- list()
      mt <- list()
      mt["paleoMeasurementTable"] <- l
      mt[["paleoMeasurementTable"]][[1]] <- backup

      # remove paleodata from the metadata
      d[["metadata"]][["paleoData"]] <- NULL

      # place paleodata back in lipd object as a list at index 1
      d[["metadata"]][["paleoData"]] <- list()
      d[["metadata"]][["paleoData"]][[1]] <- mt

      # change the LiPDVersion value to 1.2
      d[["metadata"]][["LiPDVersion"]] <- 1.2
    }
  }
  return(d)
}



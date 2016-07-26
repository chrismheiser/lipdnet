###############################################
## Load LiPDs - Versions
## Converts the incoming LiPD data into the
## current LiPD version structure
###############################################

#' Convert LiPD version whenever necessary
#' @export
#' @param D LiPD Library
#' @return D modified LiPD Library
convert.version <- function(D){
  # Loop once for every LiPD object
  for (i in 1:length(D)){
    # Check which version this LiPD file is
    current <- D[[i]]
    version <- get.version(current)

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


#' Convert chron from a single fixed table, so a multiple scalable table
#' LiPD Verison 1.0 to 1.1 change
#' @export
#' @param d LiPD metadata
#' @return d Modified LiPD metadata
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

#' Convert paleo from a single fixed table, so a multiple scalable table
#' (LiPD Verison 1.1 to 1.2 change)
#' @export
#' @param d LiPD metadata
#' @return d Modified LiPD metadata
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

#' Check / convert and fixed data frames into scalable lists
#' @export
#' @param d LiPD metadata
#' @return d Modified LiPD metadata
convert.dfs2lst <- function(d){

  # first check that paleo and chron are lists, and not data frames
  d <- convert.df.paleo(d)
  d <- convert.df.chron(d)

  # now that they're lists, check if they're in 1.2 format
  d <- convert.chron.s2m(d)
  d <- convert.paleo.s2m(d)

  # after they're in 1.2 format, check if measurement tables are lists and not data frames
  d <- convert.df.paleo.mt(d)
  d <- convert.df.chron.mt(d)

  return(d)
}


#' Check / convert paleodata measurement table data frame to list
#' @export
#' @param d LiPD metadata
#' @return d Modified LiPD metadata
convert.df.paleo.mt <- function(d){
  table <- d[["metadata"]][["paleoData"]]
  for (i in 1:length(table)){
    old.mt <- d[["metadata"]][["paleoData"]][[i]][["paleoMeasurementTable"]]
    if (is.data.frame(old.mt)){
      l <- list()
      d[["metadata"]][["paleoData"]][[i]][["paleoMeasurementTable"]] <- l
      d[["metadata"]][["paleoData"]][[i]][["paleoMeasurementTable"]][[1]] <- old.mt
    }
  }
  return(d)
}

#' Check / convert chrondata measurement table data frame to list
#' @export
#' @param d LiPD metadata
#' @return d Modified LiPD metadata
convert.df.chron.mt <- function(d){
  table <- d[["metadata"]][["chronData"]]
  for (i in 1:length(table)){
    old.mt <- d[["metadata"]][["chronData"]][[i]][["chronMeasurementTable"]]
    if (is.data.frame(old.mt)){
      l <- list()
      d[["metadata"]][["chronData"]][[i]][["chronMeasurementTable"]] <- l
      d[["metadata"]][["chronData"]][[i]][["chronMeasurementTable"]][[1]] <- old.mt
    }
  }
  return(d)
}

#' Check / convert paleoData data frame to list
#' @export
#' @param d LiPD metadata
#' @return d Modified LiPD metadata
convert.df.paleo <- function(d){
  table<- d[["metadata"]][["paleoData"]]
  if(is.data.frame(table)){
    d[["metadata"]][["paleoData"]] <- list()
    d[["metadata"]][["paleoData"]][[1]] <- as.list(table)
  }
  return(d)
}

#' Check / convert chronData data frame to list
#' @export
#' @param d LiPD metadata
#' @return d Modified LiPD metadata
convert.df.chron <- function(d){
  table<- d[["metadata"]][["chronData"]]
  if(is.data.frame(table)){
    d[["metadata"]][["chronData"]] <- list()
    d[["metadata"]][["chronData"]][[1]] <- as.list(table)
  }
  return(d)
}




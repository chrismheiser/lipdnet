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
    lipd <- D[[i]]
    version <- get.version(lipd)

    # check and convert any data frames into lists
    lipd <- convert.dfs2lst(lipd)

    # Replace the LiPD data with the new converted structure
    D[[i]] <- lipd
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

#' Check / convert and fixed data frames into scalable lists
#' @export
#' @param d LiPD metadata
#' @return d Modified LiPD metadata
convert.dfs2lst <- function(d){

  paleos <- c("paleoData", "paleoMeasurementTable")
  chrons <- c("chronData", "chronMeasurementTable")

  # convert single entries to lists
  d <- convert.s2m(d, paleos)
  d <- convert.s2m(d, chrons)

  # first check that paleo and chron are lists, and not data frames
  d <- convert.dfs(d, paleos)
  d <- convert.dfs(d, chrons)

  return(d)
}

#' Convert from a single fixed table, to a multiple scalable table
#' (LiPD Verison 1.1 to 1.2 change)
#' @export
#' @param d LiPD metadata
#' @return d Modified LiPD metadata
convert.s2m <- function(d, keys){

  key1 <- keys[[1]]
  key2 <- keys[[2]]

  # check for multiples list in pc
  path1 <- tryCatch(
    {path1 <- d[["metadata"]][[key1]][[1]]},
    error=function(cond){
      return(NULL)
    })

  if (!is.null(path1)){
    tmp <- d[["metadata"]][[key1]]
    d[["metadata"]][[key1]] <- list()
    d[["metadata"]][[key1]][[1]] <- tmp
  }

  # check for multiples list in measurement table
  path2 <- tryCatch(
    {path2 <- d[["metadata"]][[key1]][[1]][[key2]][[1]]},
    error=function(cond){
      return(NULL)
    })

  # check for multiples list in pc
  if (!is.null(path2)){
    tmp <- as.list(d[["metadata"]][[key1]][[1]][[key2]])
    d[["metadata"]][[key1]][[1]][[key2]] <- tmp
    #d[["metadata"]][[key1]][[1]][[key2]][[1]] <- tmp
  }

  # change the LiPDVersion value to 1.2
  d[["metadata"]][["LiPDVersion"]] <- 1.2
  return(d)
}

#' Convert data frame tables into lists
#' @export
#' @param d LiPD metadata
#' @param keys Table keys
#' @return d Modified LiPD metadata
convert.dfs <- function(d, keys){

  key1 <- keys[[1]]
  key2 <- keys[[2]]

  # loop for tables inside p/c
  for (i in 1:length(d[["metadata"]][[key1]])){

    # loop for tables in the meas.tables
    for (j in 1:length(d[["metadata"]][[key1]][[i]][[key2]])){
      # if the meas table @ idx is a data frame
      if (is.data.frame(d[["metadata"]][[key1]][[i]][[key2]][[j]])){
        d[["metadata"]][[key1]][[i]][[key2]][[j]] <- as.list(d[["metadata"]][[key1]][[i]][[key2]][[j]])
      }
    }

    # if the meas table is a data frame
    if (is.data.frame( d[["metadata"]][[key1]][[i]][[key2]])){
      d[["metadata"]][[key1]][[i]][[key2]] <- as.list(d[["metadata"]][[key1]][[i]][[key2]])
    }

    # if p/c @ index is a data frame
    if (is.data.frame(d[["metadata"]][[key1]][[i]])){
      d[["metadata"]][[key1]][[i]] <- as.list(d[["metadata"]][[key1]][[i]])
    }
  }

  # if p/c is a data frame
  if (is.data.frame(d[["metadata"]][[key1]])){
    d[["metadata"]][[key1]] <- as.list(d[["metadata"]][[key1]])
  }

  return(d)
}


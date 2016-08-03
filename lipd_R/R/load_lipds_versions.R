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

  paleos <- c("paleoData", "paleoMeasurementTable", "paleoModel")
  chrons <- c("chronData", "chronMeasurementTable", "chronModel")

  # convert single entries to lists. matching structure to 1.2
  d <- convert.s2m(d, paleos)
  d <- convert.s2m(d, chrons)

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
  key3 <- keys[[3]]

  # [paleo] - to list
  if (is.data.frame(d[["metadata"]][[key1]])){
  tmp <- d[["metadata"]][[key1]]
  d[["metadata"]][[key1]] <- list()
  d[["metadata"]][[key1]][[1]] <- as.list(tmp)
  }

  # [paleo][1] - exists?
  path1 <- tryCatch(
    {path1 <- d[["metadata"]][[key1]][[1]]},
    error=function(cond){
      return(NULL)
    })

  # [paleo][1] - to list
  if (is.null(path1)){
    tmp <- d[["metadata"]][[key1]]
    d[["metadata"]][[key1]] <- list()
    d[["metadata"]][[key1]][[1]] <- tmp
  }

  # [paleo] loop
  for (i in 1:length(d[["metadata"]][[key1]])){

    # [paleo][1] - data frame?
    if (is.data.frame(d[["metadata"]][[key1]][[i]])){
      d[["metadata"]][[key1]][[i]] <- as.list(d[["metadata"]][[key1]][[i]])
    }

    # [paleo][1][meas] - exists?
    path.meas <- tryCatch(
      {path.meas <- d[["metadata"]][[key1]][[i]][[key2]]},
      error=function(cond){return(NULL)}
    )

    # [paleo][1][model] - exists?
    path.model <- tryCatch(
      {path.model <- d[["metadata"]][[key1]][[i]][[key3]]},
      error=function(cond){return(NULL)}
    )

    # [meas] and [model] do not exist.
    # make a [meas] table
    if (is.null(path.meas) & is.null(path.model)){
      tmp <- d[["metadata"]][[key1]][[i]]
      d[["metadata"]][[key1]][[i]] <- list()
      d[["metadata"]][[key1]][[i]][[key2]] <- list()
      d[["metadata"]][[key1]][[i]][[key2]][[1]] <- tmp
    }

    # check for non-indexed table. we want this to be NULL
    # [paleo][1][meas][columns] - exist?
    path.direct <- tryCatch(
      {
        if (!is.null(d[["metadata"]][[key1]][[i]][[key2]][["columns"]])){
          path.direct = TRUE
        } else {
            path.direct = NULL
        }
      }, error = function(cond){return(NULL)}
    )

    # [paleo][1][meas]
    if (!is.null(path.direct)){
      tmp <- d[["metadata"]][[key1]][[i]][[key2]]
      d[["metadata"]][[key1]][[i]][[key2]] <- list()
      d[["metadata"]][[key1]][[i]][[key2]][[1]] <- tmp
    }

    # check if the meas table is a data frame
    if (is.data.frame( d[["metadata"]][[key1]][[i]][[key2]])){
      d[["metadata"]][[key1]][[i]][[key2]] <- as.list(d[["metadata"]][[key1]][[i]][[key2]])
    }

    # check for multiples list in measurement table
    path2 <- tryCatch(
      {path2 <- d[["metadata"]][[key1]][[1]][[key2]][[1]]},
      error=function(cond){return(NULL)}
      )

    # make meas table into list
    if (is.null(path2)){
      tmp <- d[["metadata"]][[key1]][[1]][[key2]]
      d[["metadata"]][[key1]][[1]][[key2]] <- list()
      d[["metadata"]][[key1]][[1]][[key2]][[1]] <- tmp
    }

    # loop for tables in the meas.tables
    for (j in 1:length(d[["metadata"]][[key1]][[i]][[key2]])){
      # if the meas table @ idx is a data frame
      if (is.data.frame(d[["metadata"]][[key1]][[i]][[key2]][[j]])){
        d[["metadata"]][[key1]][[i]][[key2]][[j]] <- as.list(d[["metadata"]][[key1]][[i]][[key2]][[j]])
    }
    }

  }

  # change the LiPDVersion value to 1.2
  d[["metadata"]][["LiPDVersion"]] <- 1.2
  return(d)
}


# TO DO: Refactor the convert.s2m function to use this function to check data existence in path in the metadata structure
#' If a path exists, return the contents. if not, return NULL
#' @export
#' @param path Hierarchy structure path
#' @return content Contents from path
# path.exists <- function(path){
#   cont <- tryCatch(
#     {cont <- path},
#     error=function(cond){return(NULL)}
#   )
# }

###############################################
## Load LiPDs - Versions
## Converts the incoming LiPD data into the
## current LiPD version structure
###############################################

#' Convert LiPD version structure whenever necessary
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

#' Get the version number from metadata
#' @export
#' @param d LiPD Metadata
#' @return version LiPD version number
get.version <- function(d){
  version <- as.numeric(d[["metadata"]][["LiPDVersion"]])
  if (length(version)==0){
    version <- 1.0
  }
  else if (!(version %in% c(1, 1.0, 1.1, 1.2))){
    print(sprintf("LiPD Version is invalid: %s", version))
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

  # PALEODATA
  # data frame?
  dat <- has.data(d[["metadata"]], key1)

  # proceed of section exists
  if (!is.null(dat)){

    if (is.data.frame(dat)){
      d[["metadata"]][[key1]] <- list()
      d[["metadata"]][[key1]][[1]] <- as.list(dat)
    }
    # multiples?
    dat <- has.data(d[["metadata"]][[key1]], 1)
    # convert to multiples
    if (is.null(dat)){
      d[["metadata"]][[key1]] <- list()
      d[["metadata"]][[key1]][[1]] <- dat
    } # END PALEODATA

    # loop
    for (i in 1:length(d[["metadata"]][[key1]])){

      # PALEODATA[[i]]
      # data frame?
      dat <- has.data(d[["metadata"]][[key1]], i)
      if (is.data.frame(!is.null(dat))){
          d[["metadata"]][[key1]][[i]] <- as.list(dat)
      }
      # MEAS + MODEL
      # table exists ?
      # d$paleoData[[i]]$paleoMeasurementTable
      dat.meas <- has.data(d[["metadata"]][[key1]][[i]], key2)

      # table exists ?
      # d$paleoData[[i]]$paleoModel
      dat.model <- has.data(d[["metadata"]][[key1]][[i]], key3)

      # tables do not exist.
      # make a meas table
      if (is.null(dat.meas) & is.null(dat.model)){
        tmp <- d[["metadata"]][[key1]][[i]]
        d[["metadata"]][[key1]][[i]] <- list()
        d[["metadata"]][[key1]][[i]][[key2]] <- list()
        d[["metadata"]][[key1]][[i]][[key2]][[1]] <- tmp
      }  # end meas and model

      # DIRECT
      # multiples ?
      # d$paleoData[[i]]$paleoMeasurementTable$columns
      dat <- has.data(d[["metadata"]][[key1]][[i]][[key2]], "columns")
      # convert to multiples
      # d$paleoData[[i]]$paleoMeasurementTable
      if (!is.null(dat)){
        tmp <- d[["metadata"]][[key1]][[i]][[key2]]
        d[["metadata"]][[key1]][[i]][[key2]] <- list()
        d[["metadata"]][[key1]][[i]][[key2]][[1]] <- tmp
      } # end direct data

      # MEASUREMENT
      # paleoData[[i]]paleoMeasurementTable
      # data frame ?
      dat <- has.data(d[["metadata"]][[key1]][[i]], key2)
      if (is.data.frame(!is.null(dat))){
        d[["metadata"]][[key1]][[i]][[key2]] <- as.list(dat)
      }
      # multiples ?
      dat <- has.data(d[["metadata"]][[key1]][[1]][[key2]], 1)

      # convert to multiples
      # d$paleoData[[i]]$paleoMeasurementTable[[j]]
      if (is.null(dat)){
        tmp <- d[["metadata"]][[key1]][[1]][[key2]]
        d[["metadata"]][[key1]][[1]][[key2]] <- list()
        d[["metadata"]][[key1]][[1]][[key2]][[1]] <- tmp
      } # END MEASUREMENT

      # loop
      for (j in 1:length(d[["metadata"]][[key1]][[i]][[key2]])){

        # MEASUREMENT[[j]]
        # paleoData[[i]]paleoMeasurementTable[[j]]
        # data frame?
        dat <- has.data(d[["metadata"]][[key1]][[i]][[key2]], j)
        if (is.data.frame(!is.null(dat))){
          d[["metadata"]][[key1]][[i]][[key2]][[j]] <- as.list(dat)
        } # END MEASUREMENT[[j]]

      }

      # continue if Model table present
      if (length(d[["metadata"]][[key1]][[i]][[key3]]) > 0){
        # MODEL
        # paleoData[[i]]paleoModel
        # data frame ?
        dat <- has.data( d[["metadata"]][[key1]][[i]], key3)
        if (is.data.frame(!is.null(dat))){
          d[["metadata"]][[key1]][[i]][[key3]] <- as.list(dat)
        }
        # multiples ?
        # convert to multiples
        dat <- has.data(d[["metadata"]][[key1]][[1]][[key3]], 1)
        if (is.null(dat)){
          tmp <- d[["metadata"]][[key1]][[1]][[key3]]
          d[["metadata"]][[key1]][[1]][[key3]] <- list()
          d[["metadata"]][[key1]][[1]][[key3]][[1]] <- tmp
        } # END MODEL

        # loop
        for (j in 1:length(d[["metadata"]][[key1]][[i]][[key3]])){

          # MODEL[[j]]
          # paleoModel[[j]]
          # data frame ?
          dat <- has.data(d[["metadata"]][[key1]][[i]][[key3]], j)
          if (is.data.frame(!is.null(dat))){
            d[["metadata"]][[key1]][[i]][[key3]][[j]] <- as.list(dat)
          }

          # SUMMARY
          # paleoModel[[j]]$summaryTable
          # data frame ?
          dat <- has.data(d[["metadata"]][[key1]][[i]][[key3]][[j]], "summaryTable")
          if (is.data.frame(!is.null(dat))){
            d[["metadata"]][[key1]][[i]][[key3]][[j]][["summaryTable"]] <- as.list(dat)
          }

          # ENSEMBLE
          # paleoModel[[j]]$ensembleTable
          # data frame ?
          dat <- has.data(d[["metadata"]][[key1]][[i]][[key3]][[j]], "ensembleTable")
          if (is.data.frame(!is.null(dat))){
            d[["metadata"]][[key1]][[i]][[key3]][[j]][["ensembleTable"]] <- as.list(dat)
          }

          # DISTRIBUTION
          # paleoModel[[j]]$distributionTable
          dat <- has.data(d[["metadata"]][[key1]][[i]][[key3]][[j]], "distributionTable")
          if (is.data.frame(!is.null(dat))){
            d[["metadata"]][[key1]][[i]][[key3]][[j]][["distributionTable"]] <- as.list(dat)
          }
          # multiples ?
          # convert to multiples
          dat <- has.data(d[["metadata"]][[key1]][[1]][[key3]][[j]][["distributionTable"]], 1)
          if (is.null(dat)){
            tmp <- d[["metadata"]][[key1]][[i]][[key3]][[j]][["distributionTable"]]
            d[["metadata"]][[key1]][[i]][[key3]][[j]][["distributionTable"]] <- list()
            d[["metadata"]][[key1]][[i]][[key3]][[j]][["distributionTable"]][[1]] <- tmp
          } # end paleo model

          # loop
          for (k in 1:length(d[["metadata"]][[key1]][[i]][[key3]][[j]][["distributionTable"]])){

            # DISTRIBUTION[[k]]
            dat <- has.data(d[["metadata"]][[key1]][[i]][[key3]][[j]][["distributionTable"]], k)
            if (is.data.frame(!is.null(dat))){
              d[["metadata"]][[key1]][[i]][[key3]][[j]][["distributionTable"]][[k]] <- as.list(dat)
            } # END DISTRIBUTION[[k]]

          } # end dist loop

        } # end models

      } # end if


    } # end section

  } # end if section

  # change the LiPDVersion value to 1.2
  d[["metadata"]][["LiPDVersion"]] <- 1.2
  return(d)
}


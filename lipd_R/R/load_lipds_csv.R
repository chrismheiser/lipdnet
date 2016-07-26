###############################################
## Load LiPDs - Merge
## Merge metadata and csv into one LiPD object
###############################################


#' Merge csv numeric data into the metadata columns
#' @export
#' @param D The lipd library
#' @param lpds list of all LiPD files (no extension)
#' @return D modified lipd library
merge.data.lipd <- function(D, lpds){

  for (lipd in 1:length(lpds)){

      name <- lpds[[lipd]]

      # PALEODATA

      # For every paleo data entry
      for (pd.idx in 1:length(D[[name]][["metadata"]][["paleoData"]])){
        curr.pd <- D[[name]][["metadata"]][["paleoData"]][[pd.idx]]

        end <- length(curr.pd[["paleoMeasurementTable"]])
        print(end)

        # for every paleo measurement table
        for (pdt.idx in 1:end){

          # Short reference to the current table
          curr.meas <- curr.pd[["paleoMeasurementTable"]][[pdt.idx]]
          # get the table's filename
          filename <- curr.meas[["filename"]]
          if (!is.null(filename)){
            # use the filename to get csv columns
            csv.cols <- D[[name]][["csv"]][[filename]]
            # short reference to the current table columns
            meta.cols <- curr.meas[["columns"]][[1]]
            # merge the data, and set the columns as the new entry
            D[[name]][["metadata"]][["paleoData"]][[pd.idx]][["paleoMeasurementTable"]][[pdt.idx]][["columns"]][[1]] <- merge.csv(csv.cols, meta.cols)
          }
        }

        # for every model
        for (pdm.idx in 1:length(curr.pd[["paleoModel"]])){
          curr.model <- curr.pd[["paleoModel"]][[pdm.idx]]

          # for every ensemble table
          for (pdm.ens in 1:length(curr.model[["ensembleTable"]])){
            curr.ens <- curr.model[["ensembleTable"]][[pdm.ens]]
            if (pdm.ens == 1){

              # Special call to ensemble function
              filename <- curr.ens[["filename"]]
              if (!is.null(filename)){
                csv.cols <- D[[name]][["csv"]][[filename]]
                meta.cols <- curr.ens[["columns"]][[1]]
                D[[name]][["metadata"]][["paleoData"]][[pd.idx]][["paleoModel"]][[pdm.idx]][["ensembleTable"]][[pdm.ens]] = merge.csv.ens(csv.cols, meta.cols)
              }
            }
          }

          # for every distribution table
          for (pdm.dist in 1:length(curr.model[["distribution"]])){
            curr.dist <- curr.model[["distribution"]][[pdm.dist]]
            filename <- curr.dist[["filename"]]
            if (!is.null(filename)){
              csv.cols <- D[[name]][["csv"]][[filename]]
              meta.cols <- curr.dist[["columns"]][[1]]
              D[[name]][["metadata"]][["paleoData"]][[pd.idx]][["paleoModel"]][[pdm.idx]][["distributiion"]][[pdm.dist]][["columns"]][[1]] <- merge.csv(csv.cols, meta.cols)
            }
          }

          # check model table
          for (pdm.modt in 1:length(curr.model[["paleoModelTable"]])){
            # Multiple
            curr.modt <- curr.model[["paleoModelTable"]][[pdm.modt]]
            filename <- curr.modt[["filename"]]
            if (!is.null(filename)){
              csv.cols <- D[[name]][["csv"]][[filename]]
              meta.cols <- curr.modt[["columns"]][[1]]
              D[[name]][["metadata"]][["paleoData"]][[pd.idx]][["paleoModel"]][[pdm.idx]][["paleoModelTable"]][[pdm.modt]][["columns"]][[1]] <- merge.csv(csv.cols, meta.cols)
            }
          }
        }

      } ## end paleodata

    # CHRONDATA
    for (cd.idx in 1:length(D[[name]][["metadata"]][["chronData"]])){
      curr.cd <- D[[name]][["metadata"]][["chronData"]][[cd.idx]]

      # loop for measurement tables
      for (cdt.idx in 1:length(curr.cd[["chronMesurementTable"]])){
        curr.meas <- curr.cd[["chronMeasurementTable"]][[cdt.idx]]
        # check in measurement table
        filename <- curr.meas[["filename"]]
        if (!is.null(filename)){
          csv.cols <- D[[name]][["csv"]][[filename]]
          meta.cols <- curr.meas[["columns"]][[1]]
          D[[name]][["metadata"]][["chronData"]][[cd.idx]][["chronMeasurementTable"]][[cdt.idx]][["columns"]][[1]] <- merge.csv(csv.cols, meta.cols)
        }
      }

      # loop in models
      for (cdm.idx in 1:length(curr.cd[["chronModel"]])){
        curr.model <- curr.cd[["chronModel"]][[cdm.idx]]
        # check in ensemble table
        for (cdm.ens in 1:length(curr.model[["ensembleTable"]])){
          curr.ens <- curr.model[["ensembleTable"]][[cdm.ens]]
          if (cdm.ens == 1){
            # First column. One value column
            filename <- curr.ens[["filename"]]
            if (!is.null(filename)){
              csv.cols <- D[[name]][["csv"]][[filename]]
              meta.cols <- curr.ens[["columns"]][[1]]
              D[[name]][["metadata"]][["chronData"]][[cd.idx]][["chronModel"]][[cdm.idx]][["ensembleTable"]][[cdm.ens]] = merge.csv.ens(csv.cols, meta.cols)
            }
          }
        }
        # check distribution
        for (cdm.dist in 1:length(curr.model[["distribution"]])){
          curr.dist <- curr.model[["distribution"]][[cdm.dist]]
          filename <- curr.dist[["filename"]]
          if (!is.null(filename)){
            csv.cols <- D[[name]][["csv"]][[filename]]
            meta.cols <- curr.dist[["columns"]][[1]]
            D[[name]][["metadata"]][["chronData"]][[cd.idx]][["chronModel"]][[cdm.idx]][["distributiion"]][[cdm.dist]][["columns"]][[1]] <- merge.csv(csv.cols, meta.cols)
          }
        }

        # check model table
        for (cdm.modt in 1:length(curr.model[["chronModelTable"]])){
          curr.modt <- curr.model[["chronModelTable"]][[cdm.modt]]
          filename <- curr.modt[["filename"]]
          if (!is.null(filename)){
            csv.cols <- D[[name]][["csv"]][[filename]]
            meta.cols <- curr.modt[["columns"]][[1]]
            D[[name]][["metadata"]][["chronData"]][[cd.idx]][["chronModel"]][[cdm.idx]][["chronModelTable"]][[cdm.modt]][["columns"]][[1]] <- merge.csv(csv.cols, meta.cols)
          }
        }
      }

    } ## end chrondata

  }
  return(D)
}


#' Merge CSV data into the metadata
#' @export
#' @param csv.cols CSV data for this file
#' @param meta.cols Target metadata columns
#' @return meta.cols Modified metadata columns
merge.csv <- function(csv.cols, meta.cols){
  values <- list()
  for (i in 1:length(meta.cols)){
    # get a row slice from the columns data frame
    # meta.cols[which(meta.cols[["number"]] == i), ]

    # match the number to the csv column number
    csv.col <- csv.cols[[i]]
    meta.cols[["values"]][[i]] <- csv.col
  }
  # create and bind column to existing meta.cols
  return(meta.cols)
}

#' Special merge function for ensemble table entries
#' @export
#' @param csv.cols CSV data for this file
#' @param meta.cols Target metadata columns
#' @return meta.cols Modified metadata columns
merge.csv.ens <- function(csv.cols, meta.cols){
  n.cols <- list()
  # empty space at first row, since it won't have one. 2:N
  n.cols[[1]] <- NULL
  for (i in 1:length(meta.cols)){
    if (i == 1){
      # first column is normal
      csv.col <- csv.cols[[i]]
      meta.cols[["values"]][[i]] <- csv.col
    }
    else {
      # build up the 2:N columns list
      csv.col <- csv.cols[[i]]
      n.cols[[i]] <- csv.col
    }
  }
  if (!is.null(n.cols)){
    # place the 2:N col data list into the output
    meta.cols[["values"]][[2]] <- n.cols
  }
  return(meta.cols)
}



###############################################
## Load LiPDs - Convert
## Misc functions that aid in converting LiPD
## data into a preferred R analysis structure
###############################################


#' Change index-by-number to index-by-variableName
#' @export
#' @param D The lipd library
#' @param lpds list of all LiPD files (no extension)
#' @return D modified lipd library
index.by.name <- function(D, lpds){

  for (lipd in 1:length(lpds)){

    name <- lpds[[lipd]]

    # PALEODATA
    for (pd.idx in 1:length(D[[name]][["metadata"]][["paleoData"]])){
      curr.pd <- D[[name]][["metadata"]][["paleoData"]][[pd.idx]]

      # loop for measurement tables
      for (pdt.idx in 1:length(curr.pd[["paleoMesurementTable"]])){
        curr.meas <- curr.pd[["paleoMeasurementTable"]][[pdt.idx]]
        # check in measurement table
        table.name <- curr.meas[["paleoDataTableName"]]
        if (!is.null(table.name)){
          meta.cols <- curr.meas[["columns"]][[1]]
          new.cols <- index.cols.by.name(meta.cols)
          D[[name]][["metadata"]][["paleoData"]][[pd.idx]][["paleoMeasurementTable"]][[pdt.idx]][["columns"]] <- NULL
          D[[name]][["metadata"]][["paleoData"]][[pd.idx]][["paleoMeasurementTable"]][[pdt.idx]][["columns"]] <- new.cols
        }
      }

      # loop in models
      for (pdm.idx in 1:length(curr.pd[["paleoModel"]])){
        curr.model <- curr.pd[["paleoModel"]][[pdm.idx]]

        # check in ensemble table - FIX
        for (pdm.ens in 1:length(curr.model[["ensembleTable"]])){
          curr.ens <- curr.model[["ensembleTable"]][[pdm.ens]]
        }


        # check distribution
        for (pdm.dist in 1:length(curr.model[["distribution"]])){
          curr.dist <- curr.model[["distribution"]][[pdm.dist]]
          table.name <- curr.dist[["paleoDataTableName"]]
          if (!is.null(table.name)){
            meta.cols <- curr.dist[["columns"]][[1]]
            new.cols <- index.cols.by.name(meta.cols)
            D[[name]][["metadata"]][["paleoData"]][[pd.idx]][["paleoModel"]][[pdm.idx]][["distribution"]][[pdm.dist]][["columns"]] <- NULL
            D[[name]][["metadata"]][["paleoData"]][[pd.idx]][["paleoModel"]][[pdm.idx]][["distribution"]][[pdm.dist]][["columns"]] <- new.cols
          }
        }

        # check model table
        for (pdm.modt in 1:length(curr.model[["paleoModelTable"]])){
          curr.modt <- curr.model[["paleoModelTable"]][[pdm.modt]]
          table.name <- curr.modt[["paleoDataTableName"]]
          if (!is.null(table.name)){
            meta.cols <- curr.modt[["columns"]][[1]]
            new.cols <- index.cols.by.name(meta.cols)
            D[[name]][["metadata"]][["paleoData"]][[pd.idx]][["paleoModel"]][[pdm.idx]][["paleoModelTable"]][[pdm.modt]][["columns"]] <- NULL
            D[[name]][["metadata"]][["paleoData"]][[pd.idx]][["paleoModel"]][[pdm.idx]][["paleoModelTable"]][[pdm.modt]][["columns"]] <- new.cols
          }
        }
      }

    } ## end paleodata

    # CHRONDATA
    for (cd.idx in 1:length(D[["metadata"]][["chronData"]])){
      curr.cd <- D[[name]][["metadata"]][["chronData"]][[cd.idx]]

      # loop for measurement tables
      for (cdt.idx in 1:length(curr.cd[["chronMesurementTable"]])){
        curr.meas <- curr.cd[["chronMeasurementTable"]][[cdt.idx]]
        # check in measurement table
        table.name <- curr.meas[["chronDataTableName"]]
        if (!is.null(table.name)){
          meta.cols <- curr.meas[["columns"]][[1]]
          new.cols <- index.cols.by.name(meta.cols)
          D[[name]][["metadata"]][["chronData"]][[cd.idx]][["chronMeasurementTable"]][[cdt.idx]][["columns"]] <- NULL
          D[[name]][["metadata"]][["chronData"]][[cd.idx]][["chronMeasurementTable"]][[cdt.idx]][["columns"]] <- new.cols
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
              csv.cols <- D[["csv"]][[filename]]
              meta.cols <- curr.ens[["columns"]][[1]]
              D[[name]][["metadata"]][["chronData"]][[cd.idx]][["chronModel"]][[cdm.idx]][["ensembleTable"]][[cdm.ens]][["columns"]] <- NULL
              D[[name]][["metadata"]][["chronData"]][[cd.idx]][["chronModel"]][[cdm.idx]][["ensembleTable"]][[cdm.ens]][["columns"]] <- index.cols.by.name(csv.cols, meta.cols)
            }
          }
        }
        # check distribution
        for (cdm.dist in 1:length(curr.model[["distribution"]])){
          curr.dist <- curr.model[["distribution"]][[cdm.dist]]
          table.name <- curr.dist[["chronDataTableName"]]
          if (!is.null(table.name)){
            meta.cols <- curr.dist[["columns"]][[1]]
            new.cols <- index.cols.by.name(meta.cols)
            D[[name]][["metadata"]][["chronData"]][[cd.idx]][["chronModel"]][[cdm.idx]][["distribution"]][[cdm.dist]][["columns"]] <- NULL
            D[[name]][["metadata"]][["chronData"]][[cd.idx]][["chronModel"]][[cdm.idx]][["distribution"]][[cdm.dist]][["columns"]] <- new.cols
          }
        }

        # check model table
        for (cdm.modt in 1:length(curr.model[["chronModelTable"]])){
          curr.modt <- curr.model[["chronModelTable"]][[cdm.modt]]
          table.name <- curr.modt[["chronDataTableName"]]
          if (!is.null(table.name)){
            meta.cols <- curr.modt[["columns"]][[1]]
            new.cols <- index.cols.by.name(meta.cols)
            D[[name]][["metadata"]][["chronData"]][[cd.idx]][["chronModel"]][[cdm.idx]][["chronModelTable"]][[cdm.modt]][["columns"]] <- NULL
            D[[name]][["metadata"]][["chronData"]][[cd.idx]][["chronModel"]][[cdm.idx]][["chronModelTable"]][[cdm.modt]][["columns"]] <- new.cols
          }
        }
      }

    } ## end chrondata

  }
  return(D)
}


#' Indexes the columns by name in the table, and separates data by column, instead of by attribute.
#' @export
#' @param cols list of columns to be processed
#' @return cols modified list of cols
index.cols.by.name <- function(cols){

  # flatten nested data frames into single layer data frame
  cols <- flatten(cols)

  # variables
  var.count <- length(cols$variableName)
  print(cols$variableName)

  # entries per variable
  entries.names <- colnames(cols)
  entries.col.count <- length(entries.names)

  # create output table
  table <- list()


  # -- PARSE ONE COLUMN
  # loop over variables
  for (i in 1:var.count){

    # create list for this column
    indv.col <- list()

    # get variable name for this column
    variable.name <- cols$variableName[[i]]

    # loop over entries per column
    for (j in 1:entries.col.count){

      entry.name <- entries.names[[j]]
      indv.col[[entry.name]] <- cols[[entry.name]][[i]]
    }
  # -- END PARSE ONE COLUMN

    # add column entry to table
    table[[variable.name]] <- indv.col

  }
  return(table)
}



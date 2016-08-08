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
      for (pdt.idx in 1:length(curr.pd[["paleoMeasurementTable"]])){
        curr.meas <- curr.pd[["paleoMeasurementTable"]][[pdt.idx]]
        # check in measurement table
        table.name <- curr.meas[["paleoDataTableName"]]
        if (!is.null(table.name)){
          # Reorganize table and move columns up
          table <- move.cols.up(curr.meas)
          D[[name]][["metadata"]][["paleoData"]][[pd.idx]][["paleoMeasurementTable"]][[pdt.idx]] <- table
        }
      } ## end measurement

      # loop in models
      for (pdm.idx in 1:length(curr.pd[["paleoModel"]])){
        curr.model <- curr.pd[["paleoModel"]][[pdm.idx]]

        # check in ensemble table - FIX
        # for (pdm.ens in 1:length(curr.model[["ensembleTable"]])){
        #   curr.ens <- curr.model[["ensembleTable"]][[pdm.ens]]
        # }


        # check distribution
        for (pdm.dist in 1:length(curr.model[["distribution"]])){
          curr.dist <- curr.model[["distribution"]][[pdm.dist]]
          table.name <- curr.dist[["paleoDataTableName"]]
          if (!is.null(table.name)){
            # Reorganize table and move columns up
            table <- move.cols.up(curr.dist)
            D[[name]][["metadata"]][["paleoData"]][[pd.idx]][["paleoModel"]][[pdm.idx]][["distribution"]][[pdm.dist]] <- table
          }
        } ## end distribution

        # check model table
        for (pdm.modt in 1:length(curr.model[["paleoModelTable"]])){
          curr.modt <- curr.model[["paleoModelTable"]][[pdm.modt]]
          table.name <- curr.modt[["paleoDataTableName"]]
          if (!is.null(table.name)){
            # Reorganize table and move columns up
            table <- move.cols.up(curr.modt)
            D[[name]][["metadata"]][["paleoData"]][[pd.idx]][["paleoModel"]][[pdm.idx]][["paleoModelTable"]][[pdm.modt]] <- table
          }
        } ## end model table
      } ## end models
    } ## end paleodata

    # CHRONDATA
    for (cd.idx in 1:length(D[[name]][["metadata"]][["chronData"]])){
      curr.cd <- D[[name]][["metadata"]][["chronData"]][[cd.idx]]

      # loop for measurement tables
      for (cdt.idx in 1:length(curr.cd[["chronMeasurementTable"]])){
        curr.meas <- curr.cd[["chronMeasurementTable"]][[cdt.idx]]
        # check in measurement table
        if (!is.null(curr.meas)){
          # Reorganize table and move columns up
          table <- move.cols.up(curr.meas)
          D[[name]][["metadata"]][["chronData"]][[cd.idx]][["chronMeasurementTable"]][[cdt.idx]] <- table
        }
      } ## measurement

      # loop in models
      for (cdm.idx in 1:length(curr.cd[["chronModel"]])){
        curr.model <- curr.cd[["chronModel"]][[cdm.idx]]


        # check in ensemble table
        curr.ens <- curr.model[["ensembleTable"]]
        if (!is.null(curr.ens)){
          # Reorganize table and move columns up
          print("moving up ensembleTable")
          table <- move.cols.up(curr.ens)
          D[[name]][["metadata"]][["chronData"]][[cd.idx]][["chronModel"]][[cdm.idx]][["ensembleTable"]] <- table
        }

        # check distribution table
        if(!is.null(curr.model[["distributionTable"]])){
          for (cdm.dist in 1:length(curr.model[["distributionTable"]])){
            curr.dist <- curr.model[["distributionTable"]][[cdm.dist]]
            # Reorganize table and move columns up
            table <- move.cols.up(curr.dist)
            D[[name]][["metadata"]][["chronData"]][[cd.idx]][["chronModel"]][[cdm.idx]][["distributionTable"]][[cdm.dist]] <- table
          }
        } ## end distribution

        # check summary table
        curr.modt <- curr.model[["summaryTable"]]
        if (!is.null(curr.modt)){
          # Reorganize table and move columns up
          table <- move.cols.up(curr.modt)
          D[[name]][["metadata"]][["chronData"]][[cd.idx]][["chronModel"]][[cdm.idx]][["summaryTable"]] <- table
        }

      } ## end chron Model
    }
  }
    return(D)
  }

#' Get rid of "columns" layer so that the columns data is directly beneath its corresponding table
#' @export
#' @param table Table to be reorganized
#' @return table Modified table
move.cols.up <- function(table){
  #look for columns
  if(is.null(table[["columns"]])){
    #already been removed - just needs to be named
   stop("there should be a columns variable in here")
  }else{
    # create a list
    new.cols <- list()
    col.len <- length(table[["columns"]])

    # loop for each column
    for (i in 1:col.len){
      # get the variable name
      vn <- table[["columns"]][[i]][["variableName"]]
      table[[vn]] <- table[["columns"]][[i]]
    }
    # remove the columns item from table
    table[["columns"]] <- NULL
  }
  return(table)
}


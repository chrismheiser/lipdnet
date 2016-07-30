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

      # for every paleo measurement table
      for (pdt.idx in 1:end){

        # Short reference to the current table
        curr.meas <- curr.pd[["paleoMeasurementTable"]][[pdt.idx]]
        # get the table's filename
        filename <- tryCatch(
          {path2 <- curr.meas[["filename"]]},
          error=function(cond){
            return(NULL)
          })
        if (!is.null(filename)){
          # use the filename to get csv columns
          csv.cols <- D[[name]][["csv"]][[filename]]
          # short reference to the current table columns
          meta.cols <- (curr.meas[["columns"]][[1]])
          # merge the data, and set the columns as the new entry
          D[[name]][["metadata"]][["paleoData"]][[pd.idx]][["paleoMeasurementTable"]][[pdt.idx]][["columns"]] <- merge.csv(csv.cols, meta.cols)
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
            csv.cols <- D[[name]][["csv"]][[filename]][[pdm.dist]]
            meta.cols <- curr.dist[["columns"]][[1]]
            D[[name]][["metadata"]][["paleoData"]][[pd.idx]][["paleoModel"]][[pdm.idx]][["distributiion"]][[pdm.dist]][["columns"]] <- merge.csv(csv.cols, meta.cols)
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
            D[[name]][["metadata"]][["paleoData"]][[pd.idx]][["paleoModel"]][[pdm.idx]][["paleoModelTable"]][[pdm.modt]][["columns"]] <- merge.csv(csv.cols, meta.cols)
          }
        }
      }

    } ## end paleodata

    # CHRONDATA
    for (cd.idx in 1:length(D[[name]][["metadata"]][["chronData"]])){
      curr.cd <- D[[name]][["metadata"]][["chronData"]][[cd.idx]]

      # loop for measurement tables
      for (cdt.idx in 1:length(curr.cd[["chronMeasurementTable"]])){
        curr.meas <- curr.cd[["chronMeasurementTable"]][[cdt.idx]]
        # check in measurement table
        filename <- tryCatch(
          {path2 <- curr.meas[["filename"]]},
          error=function(cond){
            return(NULL)
          })
        if (!is.null(filename)){
          csv.cols <- D[[name]][["csv"]][[filename]]
          meta.cols <- curr.meas[["columns"]][[1]]
          D[[name]][["metadata"]][["chronData"]][[cd.idx]][["chronMeasurementTable"]][[cdt.idx]][["columns"]] <- merge.csv(csv.cols, meta.cols)
        }
      }

      if(any(names(curr.cd)=="chronModel")){
        # loop in models
        chronModel=vector(mode="list",length=length(curr.cd[["chronModel"]]))
        for (cdm.idx in 1:length(curr.cd[["chronModel"]])){
          curr.model <- curr.cd[["chronModel"]][[cdm.idx]]
          # check in ensemble table - only one per model
          #         for (cdm.ens in 1:length(curr.model[["ensembleTable"]])){
          curr.ens <- curr.model[["ensembleTable"]]
          # First column. One value column
          filename <- curr.ens[["filename"]]
          if (!is.null(filename)){
            csv.cols <- D[[name]][["csv"]][[filename]]
            meta.cols <- curr.ens[["columns"]][[1]]
            columns <- merge.csv(csv.cols, meta.cols)
            toCopy = which(names(curr.ens)!="columns")
            for(tt in toCopy){
              chronModel[[cdm.idx]]$ensembleTable[[names(curr.ens)[tt]]]=curr.ens[[names(curr.ens)[tt]]]
            }
            chronModel[[cdm.idx]]$ensembleTable$columns = columns

          }

          # }
          # check distribution
          distributionTable = vector(mode = "list",length = dim(curr.model[["distributionTable"]][[1]])[1])
          if(length(distributionTable)>1){#then import them
            for (cdm.dist in 1:dim(curr.model[["distributionTable"]][[1]])[1]){
              curr.dist <- curr.model[["distributionTable"]][[1]][cdm.dist,]
              filename <- curr.dist[["filename"]]
              if (!is.null(filename)){
                csv.cols <- D[[name]][["csv"]][[filename]]
                meta.cols <- curr.dist[["columns"]][[1]]
                columns  <- merge.csv(csv.cols, meta.cols)
                toCopy = which(names(curr.dist)!="columns")
                for(tt in toCopy){
                  distributionTable[[cdm.dist]][[names(curr.dist)[tt]]]=curr.dist[[names(curr.dist)[tt]]]
                }
                distributionTable[[cdm.dist]]$columns = columns

              }
            }
            chronModel[[cdm.idx]]$distributionTable=distributionTable
          }





          # check summary table - only one
          curr.modt <- curr.model[["summaryTable"]]
          filename <- curr.modt[["filename"]]
          if (!is.null(filename)){
            csv.cols <- D[[name]][["csv"]][[filename]]
            meta.cols <- curr.modt[["columns"]][[1]]
            columns <- merge.csv(csv.cols, meta.cols)
            toCopy = which(names(curr.modt)!="columns")
            for(tt in toCopy){
              chronModel[[cdm.idx]]$summaryTable[[names(curr.modt)[tt]]]=curr.modt[[names(curr.modt)[tt]]]
            }
            chronModel[[cdm.idx]]$summaryTable$columns = columns

          }

          #add in anything that we didn't recreate
          icm=names(curr.model)
          cmnames=names(chronModel[[cdm.idx]])
          toAdd = which(!(icm %in% cmnames))
          for(ta in 1:length(toAdd)){
            chronModel[[cdm.idx]][[icm[toAdd[ta]]]]=curr.model[[icm[toAdd[ta]]]]
          }
        } ##end chronModel loop
        D[[name]][["metadata"]][["chronData"]][[cd.idx]]$chronModel = chronModel
      }#end chronModel
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
  meta.list <- list()

  for (i in 1:dim(meta.cols)[1]){
    # go through the columns
    #grab the data
    csv.col <- csv.cols[[i]]

    #make it a list
    meta.list[[i]]=as.list(meta.cols[i,])
    # meta.cols[whas.list(meta.cols[1,])ich(meta.cols[["number"]] == i), ]

    # assign in the values
    meta.list[[i]]$values = csv.col
  }
  return(meta.list)
}

#' Special merge function for ensemble table entries
#' @export
#' @param csv.cols CSV data for this file
#' @param meta.cols Target metadata columns
#' @return meta.cols Modified metadata columns
merge.csv.ens <- function(csv.cols, meta.cols){
  meta.list <- list()

  for (i in 1:dim(meta.cols)[1]){
    # go through the columns
    #grab the data
    meta.list[[i]]=as.list(meta.cols[i,])
    meta.list[[i]]$number = meta.list[[i]]$number[[1]]
    csv.col <- csv.cols[,meta.list[[i]]$number]

    # assign in the values
    meta.list[[i]]$values = csv.col
  }
  return(meta.list)
}



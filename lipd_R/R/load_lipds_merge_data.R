###############################################
## Load LiPDs - Merge
## Merge metadata and csv into one LiPD object
###############################################


merge.main <- function(D, lpds){

  paleo <- c("paleoData", "paleoMeasurementTable", "paleoModel")
  chron <- c("chronData", "chronMeasurementTable", "chronModel")

  for (lipd in 1:length(lpds)){
    name <- lpds[[lipd]]
    # merge paleo
    D[[name]] <- merge.data.lipd(D[[name]], paleo)
    # merge chron
    D[[name]] <- merge.data.lipd(D[[name]], chron)
  }

  return(D)
}

#' Merge csv numeric data into the metadata columns
#' @export
#' @param d LiPD metadata
#' @param keys Paleo or Chron keys
#' @return d Modified LiPD metadata
merge.data.lipd <- function(d, keys){

    # paleoData or chronData
    key1 <- keys[[1]]
    # measurement table
    key2 <- keys[[2]]
    # model table
    key3 <- keys[[3]]

    # d$paleoData
    pc <- d[["metadata"]][[key1]]

    # d$paleoData[[i]]
    for (i in 1:length(pc)){

      # d$paleoData[[i]]$paleoMeasurementTable
      for (j in 1:length(pc[[i]][[key2]])){

        # d$paleoData[[i]]$paleoMeasurementTable[[j]]
        table <- pc[[i]][[key2]][[j]]

        # get table filename
        filename <- tryCatch(
          {path2 <- table[["filename"]]},
          error=function(cond){
            return(NULL)
          })

        # use filename to get and merge data
        if (!is.null(filename)){
          # get csv columns
          csv.cols <- d[["csv"]][[filename]]
          # get table columns
          meta.cols <- (table[["columns"]][[1]])
          # merge data
          d[["metadata"]][[key1]][[i]][[key2]][[j]][["columns"]] <- merge.csv(csv.cols, meta.cols)
        }
      } # end measurement tables

      # model tables
      # d$paleoData[[i]]$paleoModel
      for (j in 1:length(pc[[i]][[key3]])){

        # summary table
        # d$paleoData[[i]]$paleoModel[[j]]$summaryTable[[1]] - should only be one summary table
        table <- pc[[i]][[key3]][[j]][["summaryTable"]][[1]]
        filename <- table[["filename"]]
        if (!is.null(filename)){
          # get csv columns
          csv.cols <- d[["csv"]][[filename]]
          # get table columns
          meta.cols <- table[["columns"]][[1]]
          # merge data
          d[["metadata"]][[key1]][[i]][[key3]][[j]][["summaryTable"]][[k]][["columns"]] <- merge.csv(csv.cols, meta.cols)
        }


        # ensemble table
        # d$paleoData[[i]]$paleoModel[[j]]$ensembleTable[[1]] - should only be one ensemble table
        table <- pc[[i]][[key3]][[j]][["ensembleTable"]][[1]]

        if (k == 1){
          # Special call to ensemble function
          filename <- table[["filename"]]
          if (!is.null(filename)){
            csv.cols <- d[["csv"]][[filename]]
            meta.cols <- table[["columns"]][[1]]
            d[["metadata"]][[key1]][[pc]][[key3]][[i]][["ensembleTable"]][[k]] = merge.csv.ens(csv.cols, meta.cols)
          }
        }

        # distribution table
        # d$paleoData[[i]]$paleoModel[[1]]$distributionTable
        for (k in 1:length(pc[[i]][[key3]][[j]][["distributionTable"]])){

          # d$paleoData[[i]]$paleoModel[[1]]$distributionTable[[k]]
          table <- pc[[i]][[key3]][[j]][["distributionTable"]][[k]]
          filename <- table[["filename"]]
          if (!is.null(filename)){
            csv.cols <- d[["csv"]][[filename]][[k]]
            meta.cols <- table[["columns"]][[1]]
            d[["metadata"]][[key1]][[i]][[key3]][[j]][["distributiionTable"]][[k]][["columns"]] <- merge.csv(csv.cols, meta.cols)
          }

        } # end distribution

      } # end models

    } ## end section

    # section
    #
    for (i in 1:length(d[["metadata"]][[key1]])){
      curr.cd <- d[["metadata"]][[key1]][[i]]

      # loop for measurement tables
      for (cdt.idx in 1:length(d[["metadata"]][[key1]][[i]][[key2]])){
        curr.meas <- curr.cd[[key2]][[cdt.idx]]
        # check in measurement table
        filename <- tryCatch(
          {path2 <- curr.meas[["filename"]]},
          error=function(cond){
            return(NULL)
          })
        if (!is.null(filename)){
          csv.cols <- d[["csv"]][[filename]]
          meta.cols <- curr.meas[["columns"]][[1]]
          d[["metadata"]][[key1]][[i]][[key2]][[cdt.idx]][["columns"]] <- merge.csv(csv.cols, meta.cols)
        }
      }

      if(any(names(curr.cd)==key3)){
        # loop in models
        chronModel=vector(mode="list",length=length(curr.cd[[key3]]))
        for (cdm.idx in 1:length(curr.cd[[key3]])){
          curr.model <- curr.cd[[key3]][[cdm.idx]]
          # check in ensemble table - only one per model
          #         for (cdm.ens in 1:length(curr.model[["ensembleTable"]])){
          curr.ens <- curr.model[["ensembleTable"]]
          # First column. One value column
          filename <- curr.ens[["filename"]]
          if (!is.null(filename)){
            csv.cols <- d[["csv"]][[filename]]
            meta.cols <- curr.ens[["columns"]][[1]]
            columns <- merge.csv(csv.cols, meta.cols)
            toCopy = which(names(curr.ens)!="columns")
            for(tt in toCopy){
              chronModel[[cdm.idx]]$ensembleTable[[names(curr.ens)[tt]]]=curr.ens[[names(curr.ens)[tt]]]
            }
            chronModel[[cdm.idx]]$ensembleTable$columns = columns

          }

          # check distribution
          distributionTable = vector(mode = "list",length = dim(curr.model[["distributionTable"]][[1]])[1])
          if(length(distributionTable)>1){#then import them
            for (cdm.dist in 1:dim(curr.model[["distributionTable"]][[1]])[1]){
              curr.dist <- curr.model[["distributionTable"]][[1]][cdm.dist,]
              filename <- curr.dist[["filename"]]
              if (!is.null(filename)){
                csv.cols <- d[["csv"]][[filename]]
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
            csv.cols <- d[["csv"]][[filename]]
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
        d[[name]][["metadata"]][[key1]][[i]]$chronModel = chronModel

      }#end chronModel

    } ## end chrondata

  return(d)
}


#' Merge CSV data into the metadata
#' @export
#' @param csv.cols CSV data for this file
#' @param meta.cols Target metadata columns
#' @return meta.cols Modified metadata columns
merge.csv <- function(csv.cols, meta.cols){
  meta.list <- list()

  # go through the columns
  for (i in 1:dim(meta.cols)[1]){

    # grab the data
    csv.col <- csv.cols[[i]]

    #make it a list
    meta.list[[i]]=as.list(meta.cols[i,])

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
    #go through the columns
    #grab the data
    meta.list[[i]]=as.list(meta.cols[i,])
    meta.list[[i]]$number = meta.list[[i]]$number[[1]]
    csv.col <- csv.cols[,meta.list[[i]]$number]

    # assign in the values
    meta.list[[i]]$values = csv.col
  }
  return(meta.list)
}



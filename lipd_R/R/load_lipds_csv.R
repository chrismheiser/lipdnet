###############################################
## Load LiPDs - Merge
## Merge metadata and csv into one LiPD object
###############################################

# Merge csv numeric data into the metadata columns
merge.data.lipd <- function(D){
  for (lipd in 1:length(D)){

      # Call once for paleoData
      for (pd.idx in 1:length(D[["metadata"]][["paleoData"]])){
        curr.pd <- D[["metadata"]][["paleoData"]][[pd.idx]]

        # loop for measurement tables
        for (pdt.idx in 1:length(curr.pd[["paleoMesurementTable"]])){
          curr.meas <- curr.pd[["paleoMeasurementTable"]][[pdt.idx]]
          # check in measurement table
          filename <- curr.meas[["filename"]]
          if (!is.null(filename)){
            csv.cols <- D[["csv"]][[filename]]
            meta.cols <- curr.meas[["columns"]][[1]]
            D[["metadata"]][["paleoData"]][[pd.idx]][["paleoMeasurementTable"]][[pdt.idx]][["columns"]][[1]] <- merge.csv(csv.cols, meta.cols)
          }
        }

        # loop in models
        for (pdm.idx in 1:length(curr.pd[["paleoModel"]])){
          curr.model <- curr.pd[["paleoModel"]][[pdm.idx]]
          # check in ensemble table
          for (pdm.ens in 1:length(curr.model[["ensembleTable"]])){
            curr.ens <- curr.model[["ensembleTable"]][[pdm.ens]]
            if (pdm.ens == 1){
              # First column. One value column
              filename <- curr.ens[["filename"]]
              if (!is.null(filename)){
                csv.cols <- D[["csv"]][[filename]]
                meta.cols <- curr.ens[["columns"]][[1]]
                D[["metadata"]][["paleoData"]][[pd.idx]][["paleoModel"]][[pdm.idx]][["ensembleTable"]][[pdm.ens]] = merge.csv.ens(csv.cols, meta.cols)
              }
            }
          }
          # check distribution
          for (pdm.dist in 1:length(curr.model[["distribution"]])){
            curr.dist <- curr.model[["distribution"]][[pdm.dist]]
            filename <- curr.dist[["filename"]]
            if (!is.null(filename)){
              csv.cols <- D[["csv"]][[filename]]
              meta.cols <- curr.dist[["columns"]][[1]]
              D[["metadata"]][["paleoData"]][[pd.idx]][["paleoModel"]][[pdm.idx]][["distributiion"]][[pdm.dist]][["columns"]][[1]] <- merge.csv(csv.cols, meta.cols)
            }
          }

          # check model table
          for (pdm.modt in 1:length(curr.model[["paleoModelTable"]])){
            # Multiple
            curr.modt <- curr.model[["paleoModelTable"]][[pdm.modt]]
            filename <- curr.modt[["filename"]]
            if (!is.null(filename)){
              csv.cols <- D[["csv"]][[filename]]
              meta.cols <- curr.modt[["columns"]][[1]]
              D[["metadata"]][["paleoData"]][[pd.idx]][["paleoModel"]][[pdm.idx]][["paleoModelTable"]][[pdm.modt]][["columns"]][[1]] <- merge.csv(csv.cols, meta.cols)
            }
          }
        }

      } ## end paleodata

    # Call once for paleoData
    for (cd.idx in 1:length(D[["metadata"]][["chronData"]])){
      curr.cd <- D[["metadata"]][["chronData"]][[cd.idx]]

      # loop for measurement tables
      for (cdt.idx in 1:length(curr.cd[["chronMesurementTable"]])){
        curr.meas <- curr.cd[["chronMeasurementTable"]][[cdt.idx]]
        # check in measurement table
        filename <- curr.meas[["filename"]]
        if (!is.null(filename)){
          csv.cols <- D[["csv"]][[filename]]
          meta.cols <- curr.meas[["columns"]][[1]]
          D[["metadata"]][["chronData"]][[cd.idx]][["chronMeasurementTable"]][[cdt.idx]][["columns"]][[1]] <- merge.csv(csv.cols, meta.cols)
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
              D[["metadata"]][["chronData"]][[cd.idx]][["chronModel"]][[cdm.idx]][["ensembleTable"]][[cdm.ens]] = merge.csv.ens(csv.cols, meta.cols)
            }
          }
        }
        # check distribution
        for (cdm.dist in 1:length(curr.model[["distribution"]])){
          curr.dist <- curr.model[["distribution"]][[cdm.dist]]
          filename <- curr.dist[["filename"]]
          if (!is.null(filename)){
            csv.cols <- D[["csv"]][[filename]]
            meta.cols <- curr.dist[["columns"]][[1]]
            D[["metadata"]][["chronData"]][[cd.idx]][["chronModel"]][[cdm.idx]][["distributiion"]][[cdm.dist]][["columns"]][[1]] <- merge.csv(csv.cols, meta.cols)
          }
        }

        # check model table
        for (cdm.modt in 1:length(curr.model[["chronModelTable"]])){
          # Multiple
          curr.modt <- curr.model[["chronModelTable"]][[cdm.modt]]
          filename <- curr.modt[["filename"]]
          if (!is.null(filename)){
            csv.cols <- D[["csv"]][[filename]]
            meta.cols <- curr.modt[["columns"]][[1]]
            D[["metadata"]][["chronData"]][[cd.idx]][["chronModel"]][[cdm.idx]][["chronModelTable"]][[cdm.modt]][["columns"]][[1]] <- merge.csv(csv.cols, meta.cols)
          }
        }
      }

    } ## end chrondata

  }
  return(D)
}

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

# Special merge function for ensemble table entries
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


# Go through paleo data and add values where necessary
merge.paleodata <- function(){


}

# Go through chron data and add values where necessary
merge.chrondata <- function(){

}

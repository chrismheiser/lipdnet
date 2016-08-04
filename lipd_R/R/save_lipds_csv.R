#' Collect and remove csv. Main function
#' @export
#' @param name Name of current LiPD record
#' @param d Metadata
#' @return all.data Final split of metadata and csv data
collect.csvs <- function(name, d){

  # Combine csv and metadata into a list so we can return multiple items in collect.csvs.section
  all.data <- list()
  all.data[["metadata"]] <- d
  all.data[["csv"]] <- list()

  paleos <- c("paleoData", "paleoMeasurementTable", "paleoModel")
  chrons <- c("chronData", "chronMeasurementTable", "chronModel")

  # Traverse one section at a time
  # Parallel: Get CSV from metadata, and remove CSV from metadata
  all.data <- collect.csvs.section(all.data[["metadata"]], paleos, all.data[["csv"]])
  all.data <- collect.csvs.section(all.data[["metadata"]], chrons, all.data[["csv"]])

  return(all.data)
}

#' Collect and remove csv from one section: Paleo or chron
#' csv.data format: [ some_filename.csv $columns.data ]
#' @export
#' @param d Metadata w. values
#' @param keys Section keys
#' @param csv.data Running collection of csv data
#' @return all.data List holding the running collection of separated csv and metadata
collect.csvs.section <- function(d, keys, csv.data){
  key1 <- keys[[1]]
  key2 <- keys[[2]]
  key3 <- keys[[3]]

  # name
  crumb.pd <- paste(name, key1, sep=".")
  pd <- d[[key1]]

  # name.paleoData
  for (i in 1:length(pd)){

    # name.paleoData1
    crumb.pd.i <- paste0(crumb.pd, i)
    pd.i <- pd[[i]]

    # name.paleoData1.paleoMeasurementTable
    crumb.pd.meas <- paste(crumb.pd.i, key2, sep=".")
    pd.meas <- pd.i[[key2]]

    for (j in 1:length(pd.meas)){

      # name.paleoData1.paleoMeasurementTable1
      # this will be the ending filename for this table
      crumb.meas.filename <- paste0(crumb.pd.meas, j)
      pd.meas.i <- pd.meas[[j]]

      # add entry for new filename
      pd.meas.i[["filename"]] <- crumb.meas.filename

      # if columns exists
      if (!is.null(pd.meas.i[["columns"]])){

        # list to hold each column for this table
        vals <- list()

        # name.paleoData1.paleoMeasurementTable1 $columns
        for (k in 1:length(pd.meas.i[["columns"]])){

          # add values for this column to the main list, then remove values
          if (!is.null(pd.meas.i.cols[[k]][["values"]])){
            vals[[k]] <- pd.meas.i.cols[[k]][["values"]]
            d[[key1]][[i]][[key2]][[j]][["columns"]][[k]][["values"]] <- NULL
          }

          # remove the "number" entry for the column, then replace it with the index of this loop
          d[[key1]][[i]][[key2]][[j]][["columns"]][[k]][["number"]] <- k
        }

        # add the this csv set to the output collection
        csv.data[[crumb.meas.filename]] <- vals
      }
    }

    # name.paleoData1.paleoModel
    crumb.pd.mod <- paste(crumb.pd.i, key3, sep=".")
    pd.mod <- pd.i[[key3]]

    for (j in 1:length(pd.mod)){

      # name.paleoData1.paleoModel1
      crumb.pd.mod.i <- paste0(crumb.pd.mod, j)
      pd.mod.i<- pd.mod[[j]]


      # SUMMARY TABLE

      # name.paleoData1.paleoModel1.summaryTable
      crumb.sum.filename <- paste(crumb.pd.mod.i, "summaryTable")
      pd.sum <- pd.mod.i[["summaryTable"]]

      # add entry for new filename
      pd.sum[["filename"]] <- crumb.sum.filename

      # if columns exists
      if (!is.null(pd.sum[["columns"]])){

        # list to hold each column for this table
        vals <- list()

        # name.paleoData1.paleoModel1.summaryTable $columns
        for (k in 1:length(pd.sum[["columns"]])){

          # add values for this column to the main list, then remove values
          if (!is.null(pd.sum[[k]][["values"]])){
            vals[[k]] <- pd.sum[[k]][["values"]]
            d[[key1]][[i]][[key3]][[j]][["columns"]][[k]][["values"]] <- NULL
          }

          # remove the "number" entry for the column, then replace it with the index of this loop
          d[[key1]][[i]][[key3]][[j]][["columns"]][[k]][["number"]] <- k
        }

        # add the this csv set to the output collection
        csv.data[[crumb.sum.filename]] <- vals

      } # end summary table

      # ENSEMBLE TABLE

      # name.paleoData1.paleoModel1.ensembleTable
      crumb.ens.filename <- paste(crumb.pd.mod.i, "ensembleTable")
      pd.ens <- pd.mod.i[["ensembleTable"]]

      # add entry for new filename
      pd.ens[["filename"]] <- crumb.ens.filename

      # if columns exists
      if (!is.null(pd.ens[["columns"]])){

        # list to hold each column for this table
        vals <- list()

        # name.paleoData1.paleoModel1.ensembleTable $columns
        for (k in 1:length(pd.ens[["columns"]])){

          # add values for this column to the main list, then remove values
          if (!is.null(pd.ens.cols[[k]][["values"]])){
            vals[[k]] <- pd.ens.cols[[k]][["values"]]
            d[[key1]][[i]][[key3]][[j]][["columns"]][[k]][["values"]] <- NULL
          }

          # remove the "number" entry for the column, then replace it with the index of this loop
          d[[key1]][[i]][[key3]][[j]][["columns"]][[k]][["number"]] <- k
        }

        # add the this csv set to the output collection
        csv.data[[crumb.ens.filename]] <- vals

      } # end ensemble table

      # DISTRIBUTION TABLES

      # name.paleoData1.paleoModel1.distributionTable
      crumb.dist <- paste(crumb.pd.mod.i, "distributionTable")
      pd.dist <- pd.mod.i[["distributionTable"]]

      # loop for distributions
      for (k in 1:length(pd.dist)){

        # name.paleoData1.paleoModel1.distributionTable1
        crumb.dist.filename <- paste0(crumb.dist, k)
        pd.dist.i <- pd.dist[[k]]

        # Process this distribution
        # add entry for new filename
        pd.dist.i[["filename"]] <- crumb.dist.filename

        # if columns exists
        if (!is.null(pd.meas.i[["columns"]])){

          # list to hold each column for this table
          vals <- list()

          # name.paleoData1.paleoModel1.distributionTable1 $columns
          for (k in 1:length(pd.dist.i[["columns"]])){

            # add values for this column to the main list, then remove values
            if (!is.null(pd.dist.i.cols[[k]][["values"]])){
              vals[[k]] <- pd.dist.i.cols[[k]][["values"]]
              d[[key1]][[i]][[key3]][[j]][["columns"]][[k]][["values"]] <- NULL
            }

            # remove the "number" entry for the column, then replace it with the index of this loop
            d[[key1]][[i]][[key3]][[j]][["columns"]][[k]][["number"]] <- k
          }

          # add the this csv set to the output collection
          csv.data[[crumb.dist.filename]] <- vals

        } # end distributionTable1

      } # end distribution loop

    } # end model tables

  } # end chronDatas

  # Can only return one item, so add our two items to a list and use that.
  all.data <- list()
  all.data[["metadata"]] <- d
  all.data[["csv"]] <- csv.data
  return(all.data)

}


#' Write out each CSV file for this LiPD record
#' csv.data format: [ some_filename.csv $columns.data ]
#' @export
#' @param csv.data List of Lists of csv column data
#' @return none
write.csvs <- function(csv.data){

  csv.names <- names(csv.data)
  # loop for csv file
  for (f in 1:length(csv.names)){
    # one csv file: list of lists. [V1: [column values], V2: [columns values], etc.]
    # write.table wants a data frame or matrix, but is able to coerce a list of lists correctly also. (tested)
    write.table(csv.data[[f]], file=csv.names[[f]], col.names = FALSE, row.names=FALSE, sep=",")
  }
  return()
}

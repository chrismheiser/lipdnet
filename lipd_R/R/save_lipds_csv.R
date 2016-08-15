#' Collect csvs main. Collect and remove csv "values" fields.
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
  all.data <- collect.csvs.section(all.data[["metadata"]], paleos, all.data[["csv"]], name)
  all.data <- collect.csvs.section(all.data[["metadata"]], chrons, all.data[["csv"]], name)

  return(all.data)
}

#' Collect and remove csv from one section: Paleo or chron
#' csv.data format: [ some_filename.csv $columns.data ]
#' @export
#' @param d Metadata w. values
#' @param keys Section keys
#' @param csv.data Running collection of csv data
#' @param name LiPD data set name
#' @return all.data List holding the running collection of separated csv and metadata
collect.csvs.section <- function(d, keys, csv.data, name){
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
      crumb.meas.filename <- paste0(crumb.pd.meas, j, ".csv")
      pd.meas.i <- pd.meas[[j]]
      tmp.dat <- parse.table(pd.meas.i)

      # only set items if table has data
      if (!is.null(tmp.dat[["table"]])){
        # Set csv in overall output
        csv.data[[crumb.meas.filename]] <- tmp.dat[["csv"]]
        # overwrite old table
        d[[key1]][[i]][[key2]][[j]]<- tmp.dat[["table"]]
        # overwrite old filename
        d[[key1]][[i]][[key2]][[j]][["filename"]]<- crumb.meas.filename
      } # end measurement[i]

    } # end measurement

    # name.paleoData1.paleoModel
    crumb.pd.mod <- paste(crumb.pd.i, key3, sep=".")
    pd.mod <- pd.i[[key3]]

    for (j in 1:length(pd.mod)){

      # name.paleoData1.paleoModel1
      crumb.pd.mod.i <- paste0(crumb.pd.mod, j)
      pd.mod.i<- pd.mod[[j]]


      # SUMMARY TABLE

      # name.paleoData1.paleoModel1.summaryTable
      crumb.sum.filename <- paste0(crumb.pd.mod.i, ".summaryTable", ".csv")
      pd.sum <- pd.mod.i[["summaryTable"]]
      tmp.dat <- parse.table(pd.sum)

      # only set items if table has data
      if (!is.null(tmp.dat[["table"]])){
        # Set csv in overall output
        csv.data[[crumb.sum.filename]] <- tmp.dat[["csv"]]
        # overwrite old table
        d[[key1]][[i]][[key3]][[j]][["summaryTable"]]<- tmp.dat[["table"]]
        # overwrite old filename
        d[[key1]][[i]][[key3]][[j]][["summaryTable"]][["filename"]]<- crumb.sum.filename
      } # end summary


      # ENSEMBLE TABLE

      # name.paleoData1.paleoModel1.ensembleTable
      crumb.ens.filename <- paste0(crumb.pd.mod.i, ".ensembleTable", ".csv")
      pd.ens <- pd.mod.i[["ensembleTable"]]
      tmp.dat <- parse.table(pd.ens)

      # only set items if table has data
      if (!is.null(tmp.dat[["table"]])){
        # Set csv in overall output
        csv.data[[crumb.ens.filename]] <- tmp.dat[["csv"]]
        # overwrite old table
        d[[key1]][[i]][[key3]][[j]][["ensembleTable"]]<- tmp.dat[["table"]]
        # overwrite old filename
        d[[key1]][[i]][[key3]][[j]][["ensembleTable"]][["filename"]]<- crumb.ens.filename

      } # end ensemble


      # DISTRIBUTION TABLES

      # name.paleoData1.paleoModel1.distributionTable
      crumb.dist <- paste0(crumb.pd.mod.i, "distributionTable")
      pd.dist <- pd.mod.i[["distributionTable"]]

      for (k in 1:length(pd.dist)){

        # name.paleoData1.distributionTable1
        # this will be the ending filename for this table
        crumb.dist.filename <- paste0(crumb.dist, k, ".csv")
        pd.dist.i <- pd.dist[[k]]
        tmp.dat <- parse.table(pd.dist.i)

        # only set items if table has data
        if (!is.null(tmp.dat[["table"]])){
          # Set csv in overall output
          csv.data[[crumb.dist.filename]] <- tmp.dat[["csv"]]
          # overwrite old table
          d[[key1]][[i]][[key3]][[j]][["distributionTable"]][[k]]<- tmp.dat[["table"]]
          # overwrite old filename
          d[[key1]][[i]][[key3]][[j]][["distributionTable"]][[k]][["filename"]]<- crumb.dist.filename
        } # end distribution[i]

      } # end distribution

    } # end model tables

  } # end chronDatas

  # Can only return one item, so add our two items to a list and use that.
  all.data <- list()
  all.data[["metadata"]] <- d
  all.data[["csv"]] <- csv.data
  return(all.data)

}

#' Parse the csv value columns from the table, then split the metadata from the csv
#' @export
#' @param table Table of data
#' @return table Table w/o csv, csv Value columns
parse.table <- function(table){

  # list to hold each column for this table
  vals <- list()
  out <- list()

  # if pd.sum exists
  if (!is.null(table)){

    # if a columns entry exists
    if (!is.null(table[["columns"]])){

      # name.paleoData1.paleoModel1.summaryTable $columns
      for (k in 1:length(table[["columns"]])){

        # add values for this column to the main list, then remove values
        if (!is.null(table[["columns"]][[k]][["values"]])){
          vals[[k]] <- table[["columns"]][[k]][["values"]]
          table[["columns"]][[k]][["values"]] <- NULL
        }

        # remove the "number" entry for the column, then replace it with the index of this loop
        # however, if it's an ensemble table with many "numbers"/columns, then we'll keep it.
        if (length(table[["columns"]][[k]][["number"]]) == 1 | is.null(table[["columns"]][[k]][["number"]])){
          table[["columns"]][[k]][["number"]] <- k
        }
      }
    }
  }

  out[["table"]] <- table
  out[["csv"]] <- vals

  return(out)
}


#' Write out each CSV file for this LiPD record
#' csv.data format: [ some_filename.csv $columns.data ]
#' @export
#' @param csv.data List of Lists of csv column data
#' @return success Boolean for successful csv write
write.csvs <- function(csv.data){

  success <- TRUE
  csv.names <- names(csv.data)

  # loop for csv file
  for (f in 1:length(csv.names)){
    tmp <- matrix()

    # only keep writing if all csvs have been successful.
    if (!is.null(success)){
      # one csv file: list of lists. [V1: [column values], V2: [columns values], etc.]
      ref.name <- csv.names[[f]]
      for (i in 1:length(csv.data[[ref.name]])){
        col <- csv.data[[ref.name]][[i]]

        # convert to numeric if needed
        if (is.list(col)){
          col <- as.numeric(col)
        }
        # check if tmp matrix has data or is fresh.
        if(all(is.na(tmp))){
          # fresh, so just bind the col itself
          tmp <- tryCatch({
            cbind(col, deparse.level = 0)
          }, error = function(cond){
            print(sprintf("cbind error: %s", ref.name))
            return(NULL)
          })
        }else{
          # not fresh, bind the existing with the col
          tmp <- tryCatch({
            cbind(tmp, col, deparse.level = 0)
          }, error = function(cond){
            if(is.matrix(col)){
              tmp <- tryCatch({
                col <- t(col)
                cbind(tmp, col, deparse.level = 0)
              }, error = function(cond){
                print(sprintf("cbind error: %s", ref.name))
                return(NULL)
              })
            }
            else{
              return(NULL)
            }
          })
          # cbind didn't work here, it's possible the matrix is transposed wrong.
          # give it another try after transposing it.
          if (is.null(tmp) & is.matrix(col)){

          }
        }
      }
      if (!is.null(tmp)){
        success <- tryCatch({
          write.table(tmp, file=ref.name, col.names = FALSE, row.names=FALSE, sep=",")
          success <- TRUE
        }, error=function(cond){
          print(sprintf("Error writing csv: %s", ref.name))
          print("Check data for unequal row or column lengths")
          return(NULL)
        })
        # end try
      } # end write success
    } # end if success
  } # end loop

  if (is.null(success)){
    success <- FALSE
  }

  return(success)
}

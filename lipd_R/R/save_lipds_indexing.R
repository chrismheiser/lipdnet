#' Main indexing function.
#' @export
#' @param d Metadata
#' @return d Modified metadata
index.by.number <- function(d){

  paleos <- c("paleoData", "paleoMeasurementTable", "paleoModel")
  chrons <- c("chronData", "chronMeasurementTable", "chronModel")

  # convert single entries to lists. matching structure to 1.2
  d <- idx.section(d, paleos)
  d <- idx.section(d, chrons)

  return(d)
}

#' Index a single section. Paleo or Chron
#' @export
#' @param d Metadata
#' @param keys Section keys
#' @return d Modified metadata
idx.section <- function(d, keys){
  pc <- keys[[1]]
  meas <- keys[[2]]
  model <- keys[[3]]

  # d$paleoData
  for (i in 1:length(d[[pc]])){
    # d$paleoData[[i]]

    # d$paleoData[[i]]paleoMeasurementTable
    for (j in 1:length(d[[pc]][[i]][[meas]])){
      # d$paleoData[[i]]paleoMeasurementTable[[j]]
      new <- move.cols.down(d[[pc]][[i]][[meas]][[j]])
      d[[pc]][[i]][[meas]][[j]] <- new

    } # end meas

    # d$paleoData[[i]]paleoModel
    for (j in 1:length(d[[pc]][[i]][[model]])){
      # d$paleoData[[i]]paleoModel[[j]]

      # d$paleoData[[i]]paleoModel[[j]]$summaryTable - should only be one
      new <- move.cols.down(d[[pc]][[i]][[model]][[j]][["summaryTable"]])
      d[[pc]][[i]][[model]][[j]][["summaryTable"]] <- new

      # d$paleoData[[i]]paleoModel[[j]]$ensembleTable - should only be one
      new <- move.cols.down(d[[pc]][[i]][[model]][[j]][["ensembleTable"]])
      d[[pc]][[i]][[model]][[j]][["ensembleTable"]] <- new

      # d$paleoData[[i]]paleoModel[[j]]$distributionTable - can be one or many
      for (k in 1:length(d[[pc]][[i]][[model]][[j]][["distributionTable"]])){

        # d$paleoData[[i]]paleoModel[[j]]$distributionTable[[k]]
        new <- move.cols.down(d[[pc]][[i]][[model]][[j]][["distributionTable"]][[k]])
        d[[pc]][[i]][[model]][[j]][["distributionTable"]][[k]] <- new

      } # end distribution

    } # end model

  } # end section

  return(d)
}

#' Remove column names indexing. Set them to index by their column number
#' Place the new columns under a "columns" list
#' @export
#' @param table Table data
#' @return table Modified table data
move.cols.down <- function(table){

  # Loop through and get rid of column names.

  # set the columns to numbers

  # set columns inside [["columns"]] list

  return(table)
}

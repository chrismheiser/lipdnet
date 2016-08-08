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
      table <- d[[pc]][[i]][[meas]][[j]]

      if(!is.null(table)){
        new <- move.cols.down(table)
        d[[pc]][[i]][[meas]][[j]] <- new
      }

    } # end meas

    # d$paleoData[[i]]paleoModel
    for (j in 1:length(d[[pc]][[i]][[model]])){

      # d$paleoData[[i]]paleoModel[[j]]

      # d$paleoData[[i]]paleoModel[[j]]$summaryTable - should only be one
      table <- d[[pc]][[i]][[model]][[j]][["summaryTable"]][[1]]
      if (!is.null(table)){
        new <- move.cols.down(table)
        d[[pc]][[i]][[model]][[j]][["summaryTable"]] <- new
      }

      # d$paleoData[[i]]paleoModel[[j]]$ensembleTable - should only be one
      table <- d[[pc]][[i]][[model]][[j]][["ensembleTable"]][[1]]
      if (!is.null(table)){
        new <- move.cols.down(table)
        d[[pc]][[i]][[model]][[j]][["ensembleTable"]] <- new
      }
      # d$paleoData[[i]]paleoModel[[j]]$distributionTable - can be one or many
      for (k in 1:length(d[[pc]][[i]][[model]][[j]][["distributionTable"]])){

        # d$paleoData[[i]]paleoModel[[j]]$distributionTable[[k]]
        table <- d[[pc]][[i]][[model]][[j]][["distributionTable"]][[k]]
        if (!is.null(table)){
          new <- move.cols.down(table)
          # only add if the table exists
          d[[pc]][[i]][[model]][[j]][["distributionTable"]][[k]] <- new
        }

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

  tmp <- list()
  new.cols <- list()

  # get a list of variableNames from the columns
  for (i in 1:length(table)){
    if (is.list(table[[i]])){
      tmp[[i]] <- try({
        tmp[[i]] <- table[[i]][["variableName"]]
      })
    }
  }

  # remove all null elements
  tmp <- tmp[!sapply(tmp, is.null)]

  # make new list by number
  if (length(tmp)>0){
    for (i in 1:length(tmp)){
      # get col data
      if (!is.null(tmp[[i]])){
        one.col <- table[[tmp[[i]]]]
        # move data to new cols list
        new.cols[[i]] <- one.col
        # remove entry from table
        table[[tmp[[i]]]] <- NULL
      }
    }
  }

  # set columns inside [["columns"]] list in table
  table[["columns"]] <- new.cols

  return(table)
}

#' Main indexing. Convert all index-by-name to index-by-number.
#' @export
#' @param d Metadata
#' @return d Modified metadata
index.by.number <- function(d){

  paleos <- c("paleoData", "paleoMeasurementTable", "paleoModel")
  chrons <- c("chronData", "chronMeasurementTable", "chronModel")

  # convert single entries to lists. matching structure to 1.2
  d <- idx.section(d, paleos)
  d <- idx.section(d, chrons)
  d <- unindex.geo(d)

  return(d)
}

#' Index a single section. Paleo or Chron
#' @export
#' @param d LiPD Metadata
#' @param keys Section keys
#' @return d Modified metadata
idx.section <- function(d, keys){
  key1 <- keys[[1]]
  key2 <- keys[[2]]
  key3 <- keys[[3]]

  # d$paleoData
  for (i in 1:length(d[[key1]])){

    # d$paleoData[[i]]

    # d$paleoData[[i]]paleoMeasurementTable
    for (j in 1:length(d[[key1]][[i]][[key2]])){

      # d$paleoData[[i]]paleoMeasurementTable[[j]]
      table <- d[[key1]][[i]][[key2]][[j]]

      if(!is.null(table)){
        new <- move.cols.down(table)
        d[[key1]][[i]][[key2]][[j]] <- new
      }

    } # end meas

    # d$paleoData[[i]]paleoModel
    for (j in 1:length(d[[key1]][[i]][[key3]])){

      # d$paleoData[[i]]paleoModel[[j]]

      # d$paleoData[[i]]paleoModel[[j]]$summaryTable - should only be one
      table <- d[[key1]][[i]][[key3]][[j]][["summaryTable"]]
      if (!is.null(table)){
        new <- move.cols.down(table)
        d[[key1]][[i]][[key3]][[j]][["summaryTable"]] <- new
      }

      # d$paleoData[[i]]paleoModel[[j]]$ensembleTable - should only be one
      table <- d[[key1]][[i]][[key3]][[j]][["ensembleTable"]]
      if (!is.null(table)){
        new <- move.cols.down(table)
        d[[key1]][[i]][[key3]][[j]][["ensembleTable"]] <- new
      }
      # d$paleoData[[i]]paleoModel[[j]]$distributionTable - can be one or many
      for (k in 1:length(d[[key1]][[i]][[key3]][[j]][["distributionTable"]])){

        # d$paleoData[[i]]paleoModel[[j]]$distributionTable[[k]]
        table <- d[[key1]][[i]][[key3]][[j]][["distributionTable"]][[k]]
        if (!is.null(table)){
          new <- move.cols.down(table)
          # only add if the table exists
          d[[key1]][[i]][[key3]][[j]][["distributionTable"]][[k]] <- new
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

#' Convert geo from semi-flat structure back to original GeoJSON structure.
#' @export
#' @param d Metadata
#' @return d Modified metadata
unindex.geo <- function(d){

  tmp <- list()
  tmp$geometry <- list()
  tmp$geometry$coordinates <- list()
  tmp$properties <- list()
  geo <- d$geo

  if (!is.null(geo)){
    names <- names(geo)
    for (i in 1:length(names)){

      # type goes in root
      if (names[[i]] == "type"){
        tmp$type <- geo$type
      }
      # geometry
      else if (names[[i]] %in% c("latitude", "longitude", "elevation", "geometryType")){
        if (names[[i]] == "latitude"){ tmp$geometry$coordinates[[1]] <- geo$latitude }
        else if (names[[i]] == "longitude"){ tmp$geometry$coordinates[[2]] <- geo$longitude }
        else if (names[[i]] == "elevation"){ tmp$geometry$coordinates[[3]] <- geo$elevation }
        else if (names[[i]] == "geometryType"){ tmp$geometry$type <- geo$geometryType}
      }

      # properties
      else{
        tmp[[names[[i]]]] <- geo[[names[[i]]]]
      }
    } # end loop
    d$geo <- tmp
  } # end if

  return(d)
}

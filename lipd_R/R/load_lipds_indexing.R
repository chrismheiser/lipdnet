###############################################
## Load LiPDs - Indexing
## Misc functions that aid in converting LiPD
## data into a preferred R analysis structure
###############################################


#' Change index-by-number to index-by-variableName
#' @export
#' @param D The lipd library
#' @param lpds list of all LiPD files (no extension)
#' @return D modified lipd library
index.by.name <- function(D, lpds){
  paleo <- c("paleoData", "paleoMeasurementTable", "paleoModel")
  chron <- c("chronData", "chronMeasurementTable", "chronModel")

  for (lipd in 1:length(lpds)){
    name <- lpds[[lipd]]
    D[[name]] <- index.section(D[[name]], paleo)
    D[[name]] <- index.section(D[[name]], chron)
    D[[name]] <- index.geo(D[[name]])
  }

  return(D)
}

#' Change index-by-number for one section
#' @export
#' @param d LiPD metadata
#' @param keys Section keys
#' @return d Modified LiPD metadata
index.section <- function(d, keys){

  key1 <- keys[[1]]
  key2 <- keys[[2]]
  key3 <- keys[[3]]

  # d$paleoData
  pc <- has.data(d[["metadata"]], key1)

  # section
  if (!is.null(pc)){
    for (i in 1:length(pc)){

      # measurement
      for (j in 1:length(pc[[i]][[key2]])){

        # check in measurement table
        if (!is.null(has.data(pc[[i]][[key2]], j))){
          new.table <- move.cols.up(pc[[i]][[key2]][[j]])
          d[["metadata"]][[key1]][[i]][[key2]][[j]] <- new.table
        }
      } ## measurement

      # loop in models
      for (j in 1:length(pc[[i]][[key3]])){

        # summary
        if (!is.null(has.data(pc[[i]][[key3]][[j]], "summaryTable"))){
          new.table <- move.cols.up(pc[[i]][[key3]][[j]][["summaryTable"]])
          d[["metadata"]][[key1]][[i]][[key3]][[j]][["summaryTable"]] <- new.table
      } # end summary

        # ensemble
        if (!is.null(has.data(pc[[i]][[key3]][[j]], "ensembleTable"))){
          new.table <- move.cols.up(pc[[i]][[key3]][[j]][["ensembleTable"]])
          d[["metadata"]][[key1]][[i]][[key3]][[j]][["ensembleTable"]] <- new.table
        } # end ensemble

        # distribution
        if(!is.null(has.data(pc[[i]][[key3]][[j]], "distributionTable"))){
          for (k in 1:length(pc[[i]][[key3]][[j]][["distributionTable"]])){
            new.table <- move.cols.up(pc[[i]][[key3]][[j]][["distributionTable"]][[k]])
            d[["metadata"]][[key1]][[i]][[key3]][[j]][["distributionTable"]][[k]] <- new.table
          }
        } ## end distribution

      } ## end models
    }
  }

  return(d)
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
      try(vn <- table[["columns"]][[i]][["variableName"]])
      if (is.null(vn)){
        table[[i]] <- table[["columns"]][[i]]
      } else {
        table[[vn]] <- table[["columns"]][[i]]
      }
    }
    # remove the columns item from table
    table[["columns"]] <- NULL
  }
  return(table)
}

#' Make geo semi-flat. Remove unnecessary levels between us and data.
#' @export
#' @param d Metadata
#' @return d Modified metadata
index.geo <- function(d){
  # create a tmp list
  tmp <- list()
  geo <- d$metadata$geo

  if (!is.null(geo)){
    # properties
    if (!is.null(geo$properties)){
      names <- names(geo$properties)
      for (i in 1:length(names)){
        tmp[[names[[i]]]] <- geo$properties[[i]]
      }
    } # end properties

    # geometry
    if (!is.null(geo$geometry)){
      names <- names(geo$geometry)
      for (i in 1:length(names)){
        if (names[[i]] == "coordinates"){
          tmp$longitude <- geo$geometry$coordinates[[1]]
          tmp$latitude <- geo$geometry$coordinates[[2]]
          if (length(geo$geometry$coordinates) == 3){
            tmp$elevation <- geo$geometry$coordinates[[3]]
          }
        }
        else if (names[[i]] == "type"){
          tmp$geometryType <- geo$geometry[[i]]
        }
        else{
          tmp[[names[[i]]]] <- geo$geometry[[i]]
        }
      }
    } # end geometry

    # root geo
    names(geo)
    for (i in 1:length(names))
      if (names[[i]] != "geometry" & names[[i]] != "properties"){
        tmp[[names[[i]]]] <- geo[[names[[i]]]]
      }

    # set the new data in d
    d$metadata$geo <- tmp
  }
  return(d)
}


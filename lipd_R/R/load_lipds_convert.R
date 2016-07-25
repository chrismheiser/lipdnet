###############################################
## Load LiPDs - Convert
## Misc functions that aid in converting LiPD
## data into a preferred R analysis structure
###############################################

idx.by.name <- function(cols){

  # flatten nested data frames into single layer data frame
  cols <- flatten(cols[[1]])

  # variables
  var.count <- length(cols$variableName)

  # entries per variable
  entries.names <- colnames(cols)
  entries.col.count <- length(entries.names)

  # create output table
  table <- list()


  # -- PARSE ONE COLUMN
  # loop over variables
  for (i in 1:var.count){

    # create list for this column
    indv.col <- list()

    # get variable name for this column
    variable.name <- cols$variableName[[i]]

    # loop over entries per column
    for (j in 1:entries.col.count){

      entry.name <- entries.names[[j]]
      indv.col[[entry.name]] <- cols[[entry.name]][[i]]
    }
  # -- END PARSE ONE COLUMN

    # add column entry to table
    table[[variable.name]] <- indv.col

  }
  return(table)
}

# check / convert and fixed data frames into scalable lists
convert.dfs2lst <- function(d){

  # first check that paleo and chron are lists, and not data frames
  d <- convert.df.paleo(d)
  d <- convert.df.chron(d)

  # now that they're lists, check if they're in 1.2 format
  d <- convert.chron.s2m(d)
  d <- convert.paleo.s2m(d)

  # after they're in 1.2 format, check if measurement tables are lists and not data frames
  d <- convert.df.paleo.mt(d)
  d <- convert.df.chron.mt(d)

  return(d)
}


# check / convert paleodata measurement table data frame to list
convert.df.paleo.mt <- function(d){
  table <- d[["metadata"]][["paleoData"]]
  for (i in 1:length(table)){
    old.mt <- d[["metadata"]][["paleoData"]][[i]][["paleoMeasurementTable"]]
    if (is.data.frame(old.mt)){
      l <- list()
      d[["metadata"]][["paleoData"]][[i]][["paleoMeasurementTable"]] <- l
      d[["metadata"]][["paleoData"]][[i]][["paleoMeasurementTable"]][[1]] <- old.mt
    }
  }
  return(d)
}

# check / convert chrondata measurement table data frame to list
convert.df.chron.mt <- function(d){
  table <- d[["metadata"]][["chronData"]]
  for (i in 1:length(table)){
    old.mt <- d[["metadata"]][["chronData"]][[i]][["chronMeasurementTable"]]
    if (is.data.frame(old.mt)){
      l <- list()
      d[["metadata"]][["chronData"]][[i]][["chronMeasurementTable"]] <- l
      d[["metadata"]][["chronData"]][[i]][["chronMeasurementTable"]][[1]] <- old.mt
    }
  }
  return(d)
}

# check / convert paloedata data frame to list
convert.df.paleo <- function(d){
  table<- d[["metadata"]][["paleoData"]]
  if(is.data.frame(table)){
    d[["metadata"]][["paleoData"]] <- list()
    d[["metadata"]][["paleoData"]][[1]] <- as.list(table)
  }
  return(d)
}

# check / convert chrondata data frame to list
convert.df.chron <- function(d){
  table<- d[["metadata"]][["chronData"]]
  if(is.data.frame(table)){
    d[["metadata"]][["chronData"]] <- list()
    d[["metadata"]][["chronData"]][[1]] <- as.list(table)
  }
  return(d)
}



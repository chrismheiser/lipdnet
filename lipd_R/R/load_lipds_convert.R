###############################################
## Load LiPDs - Convert
## Misc functions that aid in converting LiPD
## data into a preferred R analysis structure
###############################################

index.by.name <- function(D){

  # index tables by name

  # index columns by name

  return(D)
}


# Indexes the column by name in the table, and separates data by column, instead of by attribute.
idx.col.by.name <- function(cols){

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



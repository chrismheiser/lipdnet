#' Main function. Loop through all LiPD records, saving, and then cleaning up
#' @export
#' @param D LiPD Library
#' @return none
save.lipds <- function(D){

  # loop by record names
  lpds <- names(D)

  for (i in 1:length(lpds)){

    d <- D[[lpds[[i]]]]
    # call one lipd by name, and pass the name too
    save.lipd.file(lpds[[i]], d)
  }

  # remove tmp directory
  rm(tmp)

  return()
}

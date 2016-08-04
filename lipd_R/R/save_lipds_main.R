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

  # done!
  return()
}


# rec <- function(d){
#
#   cols <- tryCatch({
#     cols <- d[["values"]]
#   },
#   error=function(cond){
#   })
#
#   if (is.null(cols)){
#     if (is.list(d)){
#       for (i in 1:length(d)){
#         print(d[[i]])
#         cols <- rec(d[[i]])
#       }
#     }
#   }
#   return(cols)
# }

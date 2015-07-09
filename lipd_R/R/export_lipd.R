#' Batch export to LiPD
#'
#' Iterate over all the items in a large list of files that are loaded into the global environment
#' @param d character, A list of elements. Each element is one file.
#' @return none
#' @export one lipd file per element. written to current working directory
#'

export_lipd <- function(x){
      curr_path <- getwd()
      out_path <- paste0(curr_path,'/output')
      if (dir.create(out_path)){
        dir.create(out_path)
      }
      setwd(out_path)
      print(getwd())
      count <- 1
      for (file in x){
        filename <- names(x[count])
        output_file <- paste0(filename, '.lipd')
        writeLines(toJSON(file, pretty=TRUE, byrow=TRUE), output_file)
        count <- count + 1
      }
      setwd(curr_path)
      return
}

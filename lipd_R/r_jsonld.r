library(jsonlite)
library(stringr)

# input : .Rdata
# output: .jsonld & .csv in new folder

csv_out <- function(current, num){
  count <- num
  print(count)

  out_names <- D[[count]]$paleoData$s1
  names(out_names)
  #print(names(out_names))
  
  if(length(names(out_names)) == 0){
    print("empty")
    return
  }
  
  bind <- list()
  
  for (i in which(names(out_names)!="notes")) {
    tryCatch(x <- D[[count]]$paleoData$s1[[i]]$values, error=function(e) NULL)
    tryCatch(bind[[i]] <- x, error=function(e) NULL)
  }
  
  print(bind)
  
  #creating the csv file
  directory <- paste('output/', current, '/', sep = "")
  path <- paste(directory, current, '.csv', sep = "")
  dir.create(directory, showWarnings = FALSE,  mode = "0777")
  file.create(path, showWarnings = FALSE)
  
  go <- list(bind[1])
  if(go != NULL || length(go) != 0){
    for (i in 1:length(bind)-1){
      if(i == 1){
        go <- bind[1]
      }
      else{
        tryCatch(go <- cbind(go, bind[[i]]), error=function(e) NULL)
      }
    }
    write.csv(go, path, row.names <- FALSE, col.names <- FALSE)
    #print(go)
    print(current)
  }
}

jsonld_out <- function(current, num){
  
  file_name <- current
  
  count <- num
  
  
  template <- '{

  "@context" : "context.jsonld",
  "archiveType" : "",
  "collectionName" : "",
  "comments" : "",
  "dataSetName" : "",
  "geo" : {
      "geometry" : {
          "coordinates" : {
              "latitude" : "",
              "longitude" : "",
              "elevation" : ""
          },
          "type" : ""
      },
      "properties" : {
          "siteName" : ""
      },
      "type" : ""
  },
  "paleoData" : {
      "columns" : [],
      "filename" : "",
      "paleoDataTableName" : ""
  },
  "pub" : {
      "DOI" : "",
      "author" : {},
      "edition" : "",
      "identifier" : {},
      "journal" : "",
      "pages" : "",
      "pubYear" : "",
      "publisher" : "",
      "title" : "",
      "volume" : ""
  }
}'
  
  json_data <- fromJSON(template)
  
  
  # sets all of the json data in the .jsonld file
  json_data$archiveType <- D[[count]]$archiveType
  json_data$collectionName <- ""
  json_data$comments <- ""
  json_data$dataSetName <- D[[count]]$dataSetName
  json_data$geo$geometry$coordinates$latitude <- D[[1]]$geo$latitude
  #print(D[[count]]$geo$latitude)
  json_data$geo$geometry$coordinates$longitude <- D[[count]]$geo$longitude
  json_data$geo$geometry$coordinates$elevation <- D[[count]]$geo$elevation
  json_data$geo$geometry$type <- D[[count]]$geo$type
  json_data$geo$properties$siteName <- D[[count]]$geo$siteName
  json_data$paleoData$columns <- make_columns(count)
  json_data$paleoData$filename <- paste(file_name, ".csv")
  #json_data$paleoData$paleoDataTableName <-
  #json_data$pub$DOI <- 
  #json_data$pub$author <- 
  #json_data$pub$edition <-
  #json_data$pub$identifier <-
  #json_data$pub$journal <-
  #json_data$pub$pages <-
  json_data$pub$pubYear <- D[[count]]$pubYear
  
  
  x <- toJSON(json_data, pretty = TRUE, byrow = TRUE)
  directory <- paste('output/', file_name, '/', sep="")
  path <- paste(directory, file_name, '.jsonld', sep="")
  dir.create(directory, showWarnings = FALSE,  mode = "0777")
  file.create(path, showWarnings = FALSE, mode = "0777")
  writeLines(x, path)
  print(file_name)
}

make_columns <- function(count){
  num <- count
  index <- 0
  
  json <- '{
    "number": "",
    "dataType": "",
    "shortName": "",
    "longName": "",
    "units": "",
    "parameter": "",
    "climateInterpretation": {
      "parameter": "",
      "interpDirection": "",
      "parameterDetail": "",
      "seasonality": ""
    } 
  }'
  
  json_data <- fromJSON(json)

  
  file <- D[[num]]$paleoData$s1
  
  for (i in D[[num]]$paleoData$s1){
    index <- index + 1
  }
  
  return_value <- vector("list", index)
  
  if (index == 0){
    return('')
  }

  else {
    count <- 1
    for(i in 1:index){
      json_data$number <- count
      tryCatch(json_data$dataType <- class(D[[num]]$paleoData$s1[[count]]$values[1]), error=function(e) NULL)
      tryCatch(json_data$shortName <- D[[num]]$paleoData$s1[[count]]$parameter, error=function(e) NULL)
      json_data$longName <- ''
      tryCatch(json_data$units <- D[[num]]$paleoData$s1[[count]]$units, error=function(e) NULL)
      tryCatch(json_data$parameter <- D[[num]]$paleoData$s1[[count]]$parameter, error=function(e) NULL)
      #tryCatch(json_data$climateInterpretation$parameter <- D[[num]]$paleoData$s1[[count]]$parameter, error=function(e) NULL)
      json_data$climateInterpretation$interpDirection <- ''
      json_data$climateInterpretation$parameterDetail <- ''
      json_data$climateInterpretation$seasonality <- ''
      
      return_value[[i]] <- json_data
      count <- count + 1
    }
    return(return_value)
  }
  
}

#print(getwd())
main <- function(){
  file_names <- names(D)
  #print(file_names)
  num <- 1
  #for (i in 1:length(file_names)) {
    jsonld_out(names(D)[1], 1)
    #csv_out(names(D)[i], i)
  #}
}

main()

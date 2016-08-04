cor.ens = function(time1,values1,time2,values2,binvec = NA,binstep = NA ){
  
  
  if(ncol(time1)>1 & ncol(values1)==1)
  test = apply(time1,MARGIN = 2,function(x) bin(time = x,values = values1,binvec = binvec)$y)
  
  
  
  
  #time1, values1, time2, and values2 all must have the same length. Use bin if you need to make them the same length
  
  #make them all matrixes
  time1 = as.matrix(time1)
  time2 = as.matrix(time2)
  values1 = as.matrix(values1)
  values2 = as.matrix(values2)
  
  if(length(unique(c(nrow(time1),nrow(time2),nrow(values1),nrow(values2)))) > 1){
    stop("All times and values must have the same number of rows")
  }
  
  

  
  
}

bin.ens = function(time,values,binvec,binfun=mean,max.ens=NA){
  #takes ensembles in time and/or values and creates a matrix of data for future analysis
  time = as.matrix(time)
  values = as.matrix(values)
  
  
  #if it's an age ensemble only
  if(ncol(time)>1 & ncol(values)==1){
    if(!is.na(max.ens)){
      if(max.ens<ncol(time)){
        time=time[,1:max.ens]
      }
    }
    binMat = apply(time,MARGIN = 2,function(x) bin(time = x,values = values,binvec = binvec,binfun = binfun)$y)
    
    #if it's a value ensemble only
  }else if(ncol(time)==1 & ncol(values)>1){
    if(!is.na(max.ens)){
      if(max.ens<ncol(values)){
        values=values[,1:max.ens]
      }
    }
    binMat = apply(values,MARGIN = 2,function(x) bin(time = time,values = x,binvec = binvec,binfun = binfun)$y)
    
    
    #if it's a value AND age ensemble
  }else if(ncol(time)>1 & ncol(values)>1){
   nx = ncol(time)
   ny = ncol(values)
   if(!is.na(max.ens)){
     if(max.ens<ncol(time)){
       time=time[,1:max.ens]
     }
   }
     binMat = apply(time,MARGIN = 2,function(x) bin(time = x,values = values[,sample.int(ny,size=1)],binvec = binvec,binfun = binfun)$y)
#both are single values
  }else{
   #just regular bin
    binMat = bin(time = time,values = values,binvec = binvec,binfun = binfun)$y
  }
  
  
  bin_x = apply(cbind(binvec[-1],binvec[-length(binvec)]),1,mean)
  binned=list("time"=bin_x,"matrix" = binMat)
  return(binned)
  
}


bin = function(time,values,binvec,binfun = mean){
  #function that puts data into appropriate bins, based on the time and the binning vector
  #the bin vector describes the edges of the bins
  #binfun is the function to use for the binning, mean, sum, sd are all reasonable options
  bin_y = rep(NA,times = length(binvec)-1)
  bin_x = apply(cbind(binvec[-1],binvec[-length(binvec)]),1,mean)
  
  for(i in 1:length(bin_y)){
    q = which(time > binvec[i] & time <= binvec[i+1])
    bin_y[i] = binfun(values[q],na.rm=TRUE)
  }
  
  binned = data.frame(x=bin_x,y=bin_y)
  return(binned)

}



#correlate.ensemble2single = function(L,varname,which.paleo=NA,which.pmt=NA,targetTime,targetData)
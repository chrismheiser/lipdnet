regress=function (X,Y){
  g=which(!apply(is.na(X),1,any) & !is.na(Y))
  X=X[g,]
  Y=Y[g]
  b=solve(t(X)%*%X)%*%(t(X)%*%Y)
  return(b)
}

regression.ens = function(timeX,valuesX,timeY,valuesY,binvec = NA,binstep = NA ,binfun=mean,max.ens=NA,percentiles=c(pnorm(-2:2)),plot.reg=TRUE){
  
  #make them all matrices
  timeX = as.matrix(timeX)
  timeY = as.matrix(timeY)
  valuesX = as.matrix(valuesX)
  valuesY = as.matrix(valuesY)
  
  if(nrow(timeX) != nrow(valuesX)){stop("timeX and valuesX must have the same number of rows (observations)")}
  if(nrow(timeY) != nrow(valuesY)){stop("timeY and valuesY must have the same number of rows (observations)")}
  
  if(all(is.na(binvec))){
    if(is.na(binstep)){
      stop("Either a binvec or binstep must be specified")
    }else{
      binStart=min(c(timeX,timeY))
      binStop=max(c(timeX,timeY))
      binvec=seq(binStart,binStop,by=binstep)
    }
  }
  
  #create ensemble bins
  dum = bin.ens(time = timeX,values = valuesX,binvec = binvec,binfun=binfun,max.ens=max.ens)
  binYear = dum$time
  binX = dum$matrix
  binY = bin.ens(time = timeY,values = valuesY,binvec = binvec,binfun=binfun,max.ens=max.ens)$matrix
  
  #how many ensemble members?
  nensPoss = ncol(binX)*ncol(binY)
  nens=nensPoss
  if(!is.na(max.ens)){
    if(max.ens<nensPoss){
      nens=max.ens
    }
  }
  
  randomize=FALSE
  if(nens<nensPoss){#if were examining only a subset of the possible permutations, randomize which ones we sample
    randomize=TRUE
  }
  
  #do the regression...
  m=matrix(NA,ncol = nens)
  b=m
  if(randomize){
    rX = sample.int(ncol(binX),size = nens,replace = TRUE)
    rY = sample.int(ncol(binY),size = nens,replace = TRUE)
  }else{
    rX = c(t(matrix(rep(seq(1,ncol(binX)),times = ncol(binY)),ncol = ncol(binY))))
    rY = c(matrix(rep(seq(1,ncol(binY)),times = ncol(binX)),ncol = ncol(binX)))
  }
  
  #ones columns
  ones=matrix(1,nrow = nrow(binX))
  
  #setup progress bar
  pb <- txtProgressBar(min=1,max=nens,style=3)
  print(paste("Calculating",nens,"regressions"))
  #do the regressions
  for(i in 1:nens){
    B=regress(X = cbind(binX[,rX[i]],ones),Y = binY[,rY[i]])
    m[i]=B[1]
    b[i]=B[2]
    if(i%%100==0){
      setTxtProgressBar(pb, i)
    }
  }
  close(pb)
  
  #calculate some default statistics
  if(!is.na(percentiles)){
    ms = sort(m)
    bs = sort(b)
    N=length(ms)
    regStats = data.frame(percentiles,"m" = m[round(percentiles*N)],"b" = b[round(percentiles*N)])
    row.names(regStats)=format(regStats$percentiles,digits = 2)
  }
  reg.ens.data=list(m,b,regStats)
  
  if(plot.reg){
    maxPlotN=1000#max number to plot
    np = min(maxPlotN,nens)
    #sample randomly what to plot
    pX = sample.int(ncol(binX),size = np,replace = TRUE)
    pY = sample.int(ncol(binY),size = np,replace = TRUE)
    #create data frame of uncertain X, Y data
    Xplot = c(binX[,pX])
    Yplot = c(binY[,pY])
    dfXY = data.frame("x"=Xplot,"y"=Yplot)
    
    #create a path for the fit lines
    xrange = range(Xplot,na.rm = TRUE)
    yrange = range(Yplot,na.rm = TRUE)
    xvec = c(xrange,NA)
    yall = c()
    xall = c()
    pXY=pX*pY
    df = data.frame(m=m[pXY],b=b[pXY])
    for(p in 1:np){
      yvec = c(df$m[p]*xrange + df$b[p],NA)
      yall = c(yall,yvec)
      xall = c(xall,xvec)
    }
    dfi = data.frame(x=xall,y=yall)
    
    

    library(ggplot2)
    scatterplot = ggplot(data=dfXY)+
      geom_point(aes(x = x,y=y),alpha=alp)+
      geom_path(data=dfi,aes(x=x,y=y),colour = "red",alpha=alp)+
      theme_bw()+
      xlim(xrange)
      scatterplot

    histPlot = ggplot(data=df)+
      geom_histogram(aes(x=r,y=..density..),colour="white")+
      theme_bw()+
      ylab("Probability density")
    if(!is.na(percentiles)){
      histPlot = histPlot + geom_vline(data=corStats,aes(xintercept = values),colour="red") +
        geom_label(data = corStats, aes(x = values, y=0,label=rownames(corStats)))
      
    }
    print(histPlot)
    cor.ens.data$plot = histPlot
  }
  
  return(cor.ens.data)
  
}

cor.ens = function(time1,values1,time2,values2,binvec = NA,binstep = NA ,binfun=mean,max.ens=NA,percentiles=c(pnorm(-2:2)),plot.hist=TRUE){
  
  #make them all matrices
  time1 = as.matrix(time1)
  time2 = as.matrix(time2)
  values1 = as.matrix(values1)
  values2 = as.matrix(values2)
  
  if(nrow(time1) != nrow(values1)){stop("time1 and values1 must have the same number of rows (observations)")}
  if(nrow(time2) != nrow(values2)){stop("time2 and values2 must have the same number of rows (observations)")}
  
  if(is.na(binvec)){
    if(is.na(binstep)){
      stop("Either a binvec or binstep must be specified")
    }else{
      binStart=min(c(time1,time2))
      binStop=max(c(time1,time2))
      binvec=seq(binStart,binStop,by=binstep)
    }
  }
  
  #create ensemble bins
  dum = bin.ens(time = time1,values = values1,binvec = binvec,binfun=binfun,max.ens=max.ens)
  binYear = dum$time
  bin1 = dum$matrix
  bin2 = bin.ens(time = time2,values = values2,binvec = binvec,binfun=binfun,max.ens=max.ens)$matrix
  
  #calculate the correlations
  cormat=c(cor(bin1,bin2,use = "pairwise"))
  
  #calculate some default statistics
  if(!is.na(percentiles)){
    corStats=data.frame()
    cormatS = sort(cormat)
    N=length(cormatS)
    corStats = data.frame(percentiles,"values" = cormatS[round(percentiles*N)])
    row.names(corStats)=format(corStats$percentiles,digits = 2)
  }
  cor.ens.data=list(cormat = cormat,corStats = corStats)
  
  if(plot.hist){
    library(ggplot2)
    df = data.frame("r"=cormat)
    histPlot = ggplot(data=df)+
      geom_histogram(aes(x=r,y=..density..),colour="white")+
      theme_bw()+
      ylab("Probability density")
    if(!is.na(percentiles)){
      histPlot = histPlot + geom_vline(data=corStats,aes(xintercept = values),colour="red") +
        geom_label(data = corStats, aes(x = values, y=0,label=rownames(corStats)))
      
    }
    print(histPlot)
    cor.ens.data$plot = histPlot
  }
  
  return(cor.ens.data)
  
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
        nens=min(max(nx,ny),max.ens)
    }else{
      nens = max(nx,ny)
    }
    if(nx>=ny){
    binMat = apply(time[,1:nens],MARGIN = 2,function(x) bin(time = x,values = values[,sample.int(ny,size=1)],binvec = binvec,binfun = binfun)$y)
    }else{
    binMat = apply(values[,1:nens],MARGIN = 2,function(x) bin(time = time[,sample.int(nx,size=1)],values = x,binvec = binvec,binfun = binfun)$y)
    }
    
    #both are single values
  }else{
    #just regular bin
    binMat = bin(time = time,values = values,binvec = binvec,binfun = binfun)$y
  }
  
  binMat = as.matrix(binMat)
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
plot.scatter.ens = function(binX,binY,alp=.2,maxPlotN=1000){
  binX=as.matrix(binX)
  binY=as.matrix(binY)
  
  if(nrow(binX)!=nrow(binY)){
    stop("binX and binY must have the same number of observations")
  }
  
  np = min(maxPlotN,ncol(binX)*ncol(binY))
  #sample randomly what to plot
  pX = sample.int(ncol(binX),size = np,replace = TRUE)
  pY = sample.int(ncol(binY),size = np,replace = TRUE)
  #create data frame of uncertain X, Y data
  Xplot = c(binX[,pX])
  Yplot = c(binY[,pY])
  dfXY = data.frame("x"=Xplot,"y"=Yplot)
  
  library(ggplot2)
  scatterplot = ggplot(data=dfXY)+
    geom_point(aes(x = x,y=y),alpha=alp)+
    theme_bw()
  
  return(list("plot" = scatterplot,"pX"=pX,"pY"=pY))
}

plot.trendlines.ens = function(mb.df,xrange,pXY=1:nrow(mb.df) ,alp=.2 ,color = "red",add.to.plot=ggplot()){
  #mb.df = dataframe of slopes (column 1) and intercepts (column 2)
  #xrange = range of x values (min and max)
  #pXY = index of which observations to use
  #create a path for the fit lines
  #add.to.plot if you want to add this to an existing plot, put that object here.
  xvec = c(xrange,NA)
  yall = c()
  xall = c()
  df = data.frame(m=mb.df[pXY,1],b=mb.df[pXY,2])
  for(p in 1:length(pXY)){
    yvec = c(df$m[p]*xrange + df$b[p],NA)
    yall = c(yall,yvec)
    xall = c(xall,xvec)
  }
  dfi = data.frame(x=xall,y=yall)
  
  library(ggplot2)
  trendlines = add.to.plot+
    geom_path(data=dfi,aes(x=x,y=y),colour = color,alpha=alp)+
    theme_bw()+
    xlim(xrange)
  
  
  return(trendlines)
}



plot.hist.ens = function(ensData,ensStats=NA,bins=50,lineLabels = rownames(ensStats)){
  #plots a histogram of ensemble distribution values, with horizontal bars marking the distributions
  ensData = data.frame("r"=ensData)
  library(ggplot2)
  

  
  histPlot = ggplot(data=ensData)+
    geom_histogram(aes(x=r,y=..density..),colour="white",bins=bins)+
    theme_bw()+
    ylab("Probability density")
  if(!all(is.na(ensStats))){
    #make labels better
    goodName= c("-2σ","-1σ","Median","1σ","2σ")
    realProb= c(pnorm(-2:2))
    for(i in 1:length(lineLabels)){
      p=which(abs(as.numeric(lineLabels[i])-realProb)<.001)
      if(length(p)==1){
        lineLabels[i]=goodName[p]
      }
    }
    histPlot = histPlot + geom_vline(data=ensStats,aes(xintercept = values),colour="red") +
      geom_label(data = ensStats, aes(x = values, y=0,label=lineLabels))
    
  }
  return(histPlot)
}

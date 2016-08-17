library(lipdR)
library(geoChronR)

#select the data folder in exercise 1
D = load.lipds()

#that loaded in two LiPD datasets into a "list" called D
#explore the structure of those datasets

#try making a summary plot of ODP_1098
summary_plot(D$ODP1098B12)

#OK - lets build a new age model for this dataset. 
#First lets store it as  a new variable:

M = D$ODP1098B12

#ok - lets run bacon
M = run.bacon.lipd(M)
  
#Now lets use that age ensemble to create an age ensemble for the paleoData
M = ageEnsemble.to.paleoData(M)


#OK - now lets work with the ice core data.
I = D$Dome_C_Antarctica

#This is an ice core, so the chronology is not based on radiometric tie points. Let's pretend it's layer counted (this one actually isn't) and use BAM (Banded Age Model)
I = run.BAM.lipd(I)

#now you can see that I has an ensemble too
head(I$paleoData[[1]]$paleoMeasurementTable[[1]]$ageEnsemble)


#OK, navigating these LiPD structures is kind of a pain.
#use select.data() to get the ageEnsemble and paleoData from each of the files
M.ae = select.data(M)
M.SST = select.data(M)

#take a look at what this produces: some data and metadata at the column level
M.SST

#repeat this for the ice core
I.ae = select.data(I,"age")
I.temp = select.data(I)

#This might be a good time to take a peak at the data, lets plot the ensemble of lines for one of these
plot_timeseries.lines(I.ae,I.temp,alp = 0.01)

#instead of visualizing as a bunch of individual lines (what the ensemble is) it's often better to look at these data as a 2-D probability distribution
plot_timeseries.ribbons(I.ae,I.temp)

#OK - now you're likely asking yourself, what's the correlation and it's associated p-value between these two antarctic records, given there age uncertainty? Us too. Lets calculate the ensemble correlation.
cor.out = cor.ens(I.ae,I.temp,M.ae,M.SST,binstep = 100,max.ens=100)

#lets look at the distribution of r-values
cor.out$plot_r

#and the distribution of p-values
cor.out$plot_p












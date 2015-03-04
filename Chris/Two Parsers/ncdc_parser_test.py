# -*- coding: utf-8 -*-
"""
Created on Fri Sep 26 16:40:11 2014

@author: jeg
"""

import ncdc_file_parser as nfp
import numpy as np
import matplotlib.pyplot as plt

filename = 'crystal2013.txt' 
#filename = 'Briffa.2008.Yamal.txt'
#filename = 'Calvo.2002.MD95-2011.txt'
reload(nfp)
d = nfp.ncdc_file_parser(filename)

t = data[:,0]
X = data[:,1]
plt.plot(t,X)
plt.xlabel(d['DataColumn01_LongName'].strip())
plt.xlabel(d['DataColumn02_LongName'].strip())
plt.show()



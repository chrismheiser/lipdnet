# -*- coding: utf-8 -*-
"""
Created on Wed Feb 25 14:09:46 2015

@author: khorlick
"""
###=======THIS FILE INGESTS MULTIPLE TEXT FILES IN A DIRECTORY AND PARSES EACH USING JULIEN E.J.'s NCDC PARSER========


import os
import ncdc_file_parser as nfp

#---------------------------ITERATE OVER FILES IN CURRENT WORKING DIRECTORY--------------------------

name= []

for i in os.listdir(os.getcwd()):
    if i.endswith(".txt"):
        #print i
        name.append(i)
        continue
    else:
        continue



##---------------TO DO IT INDIVIDUALLY, INSERT FILE NAME AS STRING-------------
#name = [  ex.->  '14kiri01a.txt'  ]



name=['99aust01b.txt']
for each in name:
    filename = each

#----------------APPLY JULIEN E.J.'s NCDC TXT FILE PARSER----------------------
    d = nfp.ncdc_file_parser(filename)


filename.close()

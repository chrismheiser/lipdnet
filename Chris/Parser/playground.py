__author__ = 'chrisheiser1'

import tkinter
import tkinter.filedialog
import os

root = tkinter.Tk()
root.withdraw() #use to hide tkinter window

currdir = os.getcwd()
tempdir = tkinter.filedialog.askdirectory(parent=root, initialdir=currdir, title='Please select a directory')
if len(tempdir) > 0:
    print("You chose %s" % tempdir)
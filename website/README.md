LiPD Validator README
===================

Welcome to the LiPD online validator. We have created this tool so that you can verify that your LiPD file is valid. This README will list the rules,  structure, and data that the validator is using to determine whether or not your file meets our LiPD standard.  If for some reason your LiPD file does not pass the validation, we will guide you through correcting the errors so you can leave with a valid file.

----------


Required Data
-------------
Required data is what we consider the bare minimum amount of data to create a LiPD file.  When any required data is missing, the validator will trigger **error** messages in the **red** box.

*Errors will pevent the file from being finalized until the errors are corrected.*

 - archiveType
 - dataSetName
 - paleoData
	 - measurementTable
 - geo
	 - latitude coordinate
	 - longitude coordinate


----------


##### **paleoData and chronData**

Data tables must have:

- filename

Data table columns must have:

- number
- variableName
- TSid

----------


##### **publication**

If *pub* is provided, it must have:

 - pubYear
 - journal
 - title
 - author

----------


Optional Data
-------------

Optional data is what we consider useful, but does not detract from the quality of the LiPD file. When any optional data is missing, the validator will trigger **warning** messages in the **yellow** box.

*Warnings will not prevent your file from being a valid nor will they prevent you from finalizing the file.*

 - lipdVersion
 - pub
 - TSid


----------


Structure
-------------

 - archiveType is a string
 - dataSetName is a string
 - investigator is a list of objects
 - funding is a list of objects
 - pub is a list of objects
	 - Must follow *BibJSON* standards
	 - http://okfnlabs.org/bibjson
 - geo is a list of objects
	 - Must follow *geoJSON standards
	 - http://geojson.org
 - paleoData is a list of objects
	 - paleoMeasurementTable is a list of objects
		 - columns is a list of objects
	 - model is a list of objects
		 - method is an object
		 - summaryTable is an object
		 - ensembleTable is an object
		 - distributionTable is a list of objects
 - chronData is a list of objects
	 - chronMeasurementTable is a list of objects
		 - columns is a list of objects
	 - model is a list of objects
		 - method is an object
		 - summaryTable is an object
		 - ensembleTable is an object
		 - distributionTable is a list of objects

----------


Rules
-------------

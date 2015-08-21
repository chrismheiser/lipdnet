MongoDB

Start server with path to db
mongod --dbpath c:\node\nodetest1\data\

Start the mongo client in a new terminal
mongo

Switch to the db that you want to use
use gcr_proto

* Inserts, queries, etc. are done by the client terminal, which then calls the server



Node.js

How to run on a specific port:
PORT=8080 node app.js
OR
app.set('port', process.env.PORT || 8080);


Uploading files to website server:
1. Upload files to "webapp" folder on cmh553 cefns home
2. Set new permissions:
    find webapp -exec setfacl -m m:rwx,d:m:rwx,o:---,d:o:--- {} \;
3. Verify permissions by checking:
    getfacl webapp/path/to/whatever/you/just/uploaded
3. Move files from cmh553 cefns home to website lipd folder:
    rsync -av webapp/path/to/whatever/you/uploaded /www/sites/cefns/seses/lipd/<…>

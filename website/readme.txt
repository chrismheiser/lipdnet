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

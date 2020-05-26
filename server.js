var express = require('express');
const path = require('path');
const mysql = require('mysql');
const eventEmitter = require('events');
var admin = require('firebase-admin');
const serviceAccount = require("./storit-28df0-firebase-adminsdk-do5d6-b70edb80ff.json");
const request = require('request');
const password = require('./Password');
var app = express (); 
const PORT = 8000;
// const http = require('https');
const http = require('https');
const fs = require('fs');
const socketIO = require('socket.io');

//create instance access to the server
//const server = http.createServer(options, app);
// const io = socketIO(server);
const publicPath = path.join(__dirname,'/../StorIt-Tracker');
var socketHandler = ('./socketHandler');

// app.use(express.static(publicPath));

var sslPath = '/etc/letsencrypt/live/www.vrpacman.com/';
var options = {
	key: fs.readFileSync(sslPath + 'privkey.pem'),
	cert: fs.readFileSync(sslPath + 'fullchain.pem')
}

const server = http.createServer(options, app);
// const server = http.createServer(app);
//Create app listener 
var serverListener = server.listen(PORT, () => {
	console.log('Server running at: http://localhost:'+ PORT);
});

//Initialize The Admin-SDK (configuration)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://storit-28df0.firebaseio.com"
});



//create connection for the server
var con = mysql.createConnection({
	host : 'localhost',
	user :  password.user,
	password : password.DBpassword,
	database : 'StorIt',
}); 

// require('./routes')(app);
//connect the server to the database
var createDb = function(error){
  if(error){
     console.log('error:'+ error);
  } else {
    //if it connectes it creates a database
    var sql = 'create database IF NOT EXISTS StorIt;';
    con.query(sql, (err,result) => {
      if (err) {
        console.log(err);
      }
        console.log(result);
        console.log('Created Database');
    });
    //switch connection to the database
    con.changeUser ({
      database : 'StorIt'
    }); 
        //create Server table in the database
     sql = 'Create table IF NOT EXISTS Server(' +
         'serverId int AUTO_INCREMENT,' +
         'uid VARCHAR(50),' + 
         'name VARCHAR(50),' +
         'storage bigint, ' +
         'availableStorage bigint,' +
         'location VARCHAR(50), ' +
         'status VARCHAR(50),' +
         'totalDownTime int,' +
         'currentDownTime int,' +
         'lastChecked timestamp,' +
         'PRIMARY KEY (serverId)' +
         ');';
     con.query(sql, (err,result) => {
       if (err) {
       console.log(err);
       }
       console.log(result);
       console.log('Created Server table');
     });


     //create File table in the database
        sql = 'Create table IF NOT EXISTS File(' +
            'fileId int AUTO_INCREMENT, ' +
            'uid VARCHAR(50), ' +
            'PRIMARY KEY (FileId) ' + 
            ');';
        con.query(sql, (err,result) => {
          if (err) {
          console.log(err);
          }
          console.log(result);
          console.log('Created File table');
          });

    //create Chunk table in the database
    sql = 'Create table IF NOT EXISTS Chunk(' + 
        'chunkId int AUTO_INCREMENT,' + 
        'serverId int, ' +
        'fileID int, ' +
        'chunkSize int, ' +
        'FOREIGN KEY (serverId) REFERENCES Server(serverId), ' +
        'FOREIGN KEY (fileId) REFERENCES File(fileId), ' + 
        'PRIMARY KEY (chunkId) ' +
        ');';
    con.query(sql, (err,result) => {
      if (err) {
      console.log(err);
      }
      console.log(result);
      console.log('Created Chunk');
    });
    //create Chunk table in the database
    sql = 'Create table IF NOT EXISTS Backup(' + 
        'backupId int AUTO_INCREMENT,' +
        'chunkId int,' + 
        'backupChunkId VARCHAR(50), ' + 
        'FOREIGN KEY (chunkId) REFERENCES Chunk(chunkId),' +
        'PRIMARY KEY (backupId) ' +
        ');';
    con.query(sql, (err,result) => {
      if (err) {
      console.log(err);
      }
      console.log(result);
      console.log('Created Backup');
    });


    //create Chunk table in the database
    sql = 'Create table IF NOT EXISTS Client(' + 
        'uid VARCHAR(50), ' + 
        'location VARCHAR(50), ' + 
        'PRIMARY KEY (uid) ' +
        ');';
    con.query(sql, (err,result) => {
      if (err) {
      console.log(err);
      }
      console.log(result);
      console.log('Created Client');
    });

    

    
  } 
  console.log('Connected to MySQL');
}


app.use(express.static('public'));
app.get('/createdb', (req,res) => {
	createDb();
	res.end();
});

app.get('/delete', (req,res) => {
	let sql = 'DROP Table Backup,Chunk,Server,File;';
      let query = con.query(sql, function(err, result){
      if (err) {
        console.log(err);
      } else {
        console.log("database cleared\n");
	console.log(result);
      }
	});
      res.end();
});


// io.on('connection', socketHandler);


var io = require('socket.io').listen(serverListener);

require('./socketHandler.js')(io, con, admin);

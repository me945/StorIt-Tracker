var express = require('express');
const path = require('path');
const mysql = require('mysql');
const eventEmitter = require('events');
var admin = require('firebase-admin');
const serviceAccount = require("C:\\Users\\hk2\\Desktop\\Tracker\\StorIt-Tracker\\storit-28df0-firebase-adminsdk-do5d6-b70edb80ff.json");
const request = require('request');
const password = require('./Password');
var app = express (); 
const PORT = 8080;
const http = require('http');
const socketIO = require('socket.io');

//create instance access to the server
const server = http.createServer(app);
// const io = socketIO(server);
const publicPath = path.join(__dirname,'/../StorIt-Tracker');
var socketHandler = ('./socketHandler');

// app.use(express.static(publicPath));

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
	database : '',
}); 

// require('./routes')(app);

//connect the server to the database
con.connect (function(error){
	if(error){
	   console.log('error:'+ error);
	} else {
		//if it connectes it creates a database
		var sql = 'create database IF NOT EXISTS MyDataBase;';
		con.query(sql, (err,result) => {
			if (err) {
				console.log(err);
			}
				console.log(result);
				console.log('Created Database');
		});
		//switch connection to the database
		con.changeUser ({
			database : 'MyDataBase'
		}); 

        //create Server table in the database
 		sql = 'Create table IF NOT EXISTS Server(ServerID VARCHAR(50),' +
		 		'uid VARCHAR(50),' + 
		 		'storageAmount int, ' +
		 		'socketId VARCHAR(50), ' +
		 		'PRIMARY KEY (ServerID)' +
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
        		'FileID int AUTO_INCREMENT, ' +
        		'uid VARCHAR(50), ' +
        		'PRIMARY KEY (FileID) ' + 
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
				'ChunkID int AUTO_INCREMENT, ' + 
				'uid VARCHAR(50), ' + 
				'ServerID VARCHAR(50), ' +
				'FileID int, ' +
				'chunkSize int, ' +
				'FOREIGN KEY (ServerID) REFERENCES Server(ServerID), ' +
				'FOREIGN KEY (FileID) REFERENCES File(FileID), ' + 
				'PRIMARY KEY (ChunkID) ' +
				');';
		con.query(sql, (err,result) => {
			if (err) {
			console.log(err);
			}
			console.log(result);
			console.log('Created Chunk');
		});

		

		
	} 
	console.log('Connected to MySQL');
});

// io.on('connection', socketHandler);


var io = require('socket.io').listen(serverListener);

require('./socketHandler.js')(io, con, admin);

var express = require('express');
const path = require('path');
const mysql = require('mysql');
const eventEmitter = require('events');
var admin = require('firebase-admin');
const serviceAccount = require("C:\\Users\\E.T\\AndroidStudioProjects\\StorIt-Tracker\\storit-28df0-firebase-adminsdk-do5d6-88bed76789.json");
const request = require('request');
const password = require('./Password');
var app = express (); 
const PORT = 8080;
const http = require('http');
const socketIO = require('socket.io');

//create instance access to the server
const server = http.createServer(app);
const io = socketIO(server);
const publicPath = path.join(__dirname,'/../StorIt-Tracker');

app.use(express.static(publicPath));

//Create app listener 
server.listen(PORT, () => {
	console.log('Server running at: http://localhost:'+ PORT);
});

//Initialize The Admin-SDK (configuration)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://storit-28df0.firebaseio.com"
});

//socket middleware
io.use((socket,next)=>{
if (req.headers.authorization 
			&& req.headers.authorization.split (' ')[0] === 'Bearer') {

		req.authtoken = req.headers.authorization.split(' ')[1];
	} else {
		req.authtoken = null;
	}

	next();
});

//verifying the token
io.use(async function(socket, next) {
	console.log("middleware");
    try {
      const authToken = socket.Token;
      console.log("authenticated", authToken);
      const userInfo = await admin
        .auth()
        .verifyIdToken(authToken);
      console.log("authenticated", userInfo.uid);
      socket.authId = userInfo.uid;
      next();
    } catch (e) {
		console.log("not authenticated");
	console.log(e.message);
      res
        .status(401)
        .send({ error: 'You are not authorized to make this request' });
    }
})

//create connection for the server
var con = mysql.createConnection({
	host : 'localhost',
	user :  password.user,
	password : password.DBpassword,
	database : '',
}); 

//connect the server to the database
con.connect (function(error){
	if(error){
	   console.log('error:'+ error);
	} else {
		//if it connectes it creates a database
		var sql = 'create database IF NOT EXISTS MyDataBase';
		con.query(sql, (err,result) => {
			if (err) {
				console.log(err);
			}
				console.log(result);
				console.log('Created Database');
		});
		//create table in the database
		var sql = 'Create table IF NOT EXISTS MyDataBase.ListOfSevers(id int AUTO_INCREMENT, uid VARCHAR(50), ServerID VARCHAR(50),storageSize int ,PRIMARY KEY (id))';
		con.query(sql, (err,result) => {
			if (err) {
			console.log(err);
			}
			console.log(result);
			console.log('Created ListOfSevers');
		});
		//switch connection to the database
		con.changeUser ({
			database : 'MyDataBase'
		}); 
	} 
	console.log('Connected to MySQL');
});

io.on('connection', function(client){

	socket.emit('User'+ client.id + 'connected');
	console.log('new user coneected to the server');
	
	 client.on('message', function (details) {
      console.log('got message from ' + details.to);
      var otherClient = io.sockets.connected[details.to];

      if (!otherClient) {
        return;
      }
        delete details.to;
        details.from = client.id;
        otherClient.emit('message', details);
    });

	 client.on('upload', function(details){
	 	let sql = `SELECT ServerID FROM ListOfSevers WHERE storageSize => ${details.filesize}`;
		let query = con.query(sql, (err, result) =>{
		if (err) {
			console.log(err);
		}
			socket.emit(result);
			console.log(result);
		});
	 })

	 client.on('download', function(details){
	 	let sql = `SELECT serverID FROM ListOfSevers WHERE uid = ${details.id}`;
		let query = con.query(sql, function(err, result){
		if (err) {
			console.log(err);
		}
			socket.emit(result);
			console.log(result);
		});

	 })

	 server.on('addserver', function(details) {
      serverID = details.id;
      let post = {uid:'userID', ServerID: 'ServerID'};
      let sql = `INSERT INTO ListOfSevers SET ?`;
      let query = con.query(sql,[post], function(err, result){
      	if (err){
      		socket.emit('Error'+err);
      		console.log('Error'+err);
      	}
      	else{
      		socket.emit('Server added to the database');
      		console.log('server is Inserted into the database');
      	}
      })
    });

	socket.on('disconnect', function(){
			socket.emit('Disconnected');
			console.log('user disconnected from the server');
	});
});

app.get('/show', (req, res) => {
	let sql = 'show databases';
	con.query(sql, (err,result) => {
		if (err) {
			console.log(err);
		}
			console.log(result);
			res.send('Database created');
	});
});

app.get('/drop', (req, res) => {
	let sql = 'Drop Database ip_addresse';
	con.query(sql, (err,result) => {
		if (err) {
			console.log(err);
		}
			console.log(result);
			res.send('Database created');
	});
});
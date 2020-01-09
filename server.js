//create new express and save it in app
const express = require('express');
const path = require('path');
const mysql = require('mysql');
const admin = require('firebase-admin');
const serviceAccount = require("C:\\Users\\E.T\\AndroidStudioProjects\\StorIt-Tracker\\storit-28df0-firebase-adminsdk-do5d6-99c5a01a86.json");
const request = require('request');


//Server configuration
const PORT = 3000;
//Intitalize the app express
var app = express ();
//Create app listener 
app.listen(PORT, () => {
	console.log('Server running at: http://localhost:'+ PORT);
});


//Initialize The Admin-SDK (configuration)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://storit-28df0.firebaseio.com"
});


//middle ware to authenticate firebase token in the header
const getAuthToken = (req,res,next) =>{
	if (req.headers.authorization 
			&& req.headers.authorization.split (' ')[0] === 'Bearer') {

		req.authtoken = req.headers.authorization.split(' ')[1];
	} else {
		req.authtoken = null;
	}
	next();
};

const checkIfAuthenticated = (req,res,next) =>{
	getAuthToken(req,res, async()=> {
		try{
			const {authToken} =req;
			const userInfo = await admin.auth().verifyIdToken(authToken);
			req.authId = userInfo.uid;
			return next();
		}catch (error){
			return res.status(401).send ({error: 'Access Denied'});
		}
	});
};

//verfies idToken that comes from the client app
// admin.auth().verifyIdToken(idToken)
//   .then(function(decodedToken) {
//     let uid = decodedToken.uid;

//     console.log('Successfully Authenticated');

//   }).catch(function(error) {
  	 
//   	 res.send(error)
//      console.log('Access Denied' + error);
//   });


//create connection
var con = mysql.createConnection({
	host : 'localhost',
	user :  'root',
	password : 'MyNewPass',
	database : '',

}); 

//connect to the database
con.connect (function(error){
	if(error){
	   console.log('error:'+ error);
	} else {
		//if it connectes it creates a database
		var sql = 'create database 	ip_addresses';
		con.query(sql, (err,result) => {
			if (err) {
				console.log(err);
			}
				console.log(result);
				console.log('Created Database');
		});
		//create table in the database
		var sql = 'Create table ip_addresses.PostTable(id int AUTO_INCREMENT, serverName VARCHAR(50), ip_address VARCHAR(50) ,PRIMARY KEY (id))';
		con.query(sql, (err,result) => {
			if (err) {
			console.log(err);
			}
			console.log(result);
			console.log('Create PostTable');
		});
		//switch connection to the database
		con.changeUser ({
			database : 'ip_addresses'
		}); 
	} 
	console.log('Connected to MySQL'); 
});



//Insert data into the database
app.post('/saveData', (req, res) => {
	console.log("I got a request");
	console.log(req.body);
	let post = {serverName:'req.headers.serverName ', ip_address: 'req.headers.ip_address'};
	let sql = `INSERT INTO PostTable SET ?`;
	let query = con.query(sql,[post], (err, result) =>{
		if (err) {
			console.log(err);
		}
			console.log(result);
			res.send('Server added to the database');
	});
	connection.end();
}); 

//Return Ip address of a server
app.get('/getpost/:id', (req, res) => {
	console.log("I got a request");
	let sql = `SELECT ip_address FROM PostTable WHERE id = ${req.params.id}`;
	let query = con.query(sql, (err, result) =>{
		if (err) {
			console.log(err);
		}
			res.send(result);
			console.log(result);
			res.send('Post Fetched');
	});
}); 


//-----------------Testing Functions-------------------


//Show Database
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

//drop Database
app.get('/drop', (req, res) => {
	let sql = 'Drop Database ip_addresses';
	con.query(sql, (err,result) => {
		if (err) {
			console.log(err);
		}
			console.log(result);
			res.send('Database created');
	});
});

//Create Database
app.get('/createdb', (req, res) => {
	let sql = 'create database ip_addresses';
	con.query(sql, (err,result) => {
		if (err) {
			console.log(err);
		}
			console.log(result);
			res.send('Database created');
	});
});

//create table
app.get('/createposttable', (req, res) => {
	let sql = 'Create table PostTable(id int AUTO_INCREMENT, serverName VARCHAR(50), ip_address VARCHAR(50) ,PRIMARY KEY (id))';
	con.query(sql, (err,result) => {
		if (err) {
		console.log(err);
		}
		console.log(result);
		res.send('Post table created');
	});
});

//Drop table from the database
app.get('/createdbs', (req, res) => {
	let sql = 'DROP TABLE PostTable';
	con.query(sql, (err,result) => {
		if (err) {
			console.log(err);
		}
			console.log(result);
			res.send('Database created');
	});
});

//insert post 1 to the table
app.get('/addpost1', (req, res) => {
	var post  = {serverName:'Firstserver', ip_address: '122.0.0.1' };
	let sql = 'INSERT INTO PostTable SET ?';
	let query = con.query(sql,[post], (err, result) =>{
		if (err) {
			console.log(err);
		}
			console.log(result);
			res.send('Post-1 added to the table');
	});
});


//insert post2 to the table
app.get('/addpost2', (req, res) => {
	var post  = {serverName:'Secondserver', ip_address: '128.0.0.1'};
	let sql = "INSERT INTO PostTable SET ?";
	let query = con.query(sql,[post], (err, result) => {
		if (err) {
			console.log(err);
		}
			console.log(result);
			res.send('Post-2 added to the table');
	});
}); 

//Delete post2 to the table
app.get('/delete', (req, res) => {
	var post  = {serverName:'Secondserver', ip_address: '128.0.0.1'};
	let sql = "DELETE FROM PostTable WHERE serverName = 'Firstserver'";
	let query = con.query(sql,[post], (err, result) => {
		if (err) {
			console.log(err);
		}
			console.log(result);
			res.send('Post-2 added to the table');
	});
});

//select and get all posts from database table
app.get('/getpost', (req, res) => {
	let sql = 'SELECT * FROM PostTable';
	let query = con.query(sql, (err, result) =>{
		if (err) {
			console.log(err);
		}
			console.log(result);
			res.send('Post Fetched');
	});
}); 

app.get('/getpost/:id', (req, res) => {
	console.log("I got a request");
	let sql = `SELECT ip_address FROM PostTable WHERE id = ${req.params.id}`;
	let query = con.query(sql, (err, result) =>{
		if (err) {
			console.log(err);
		}
			// res.send(result);
			console.log(result);
			res.send('Post Fetched');
	});
}); 





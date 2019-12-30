//create new express and save it in app
const express = require('express');
const path = require('path');
const mysql = require('mysql');
const admin = require('firebase-admin');
const serviceAccount = require("C:\\Users\\E.T\\AndroidStudioProjects\\StorIt-Tracker\\storit-28df0-firebase-adminsdk-do5d6-99c5a01a86.json");


//Intitalize the app express
var app = express ();


//Initialize  without parameters
var auth = admin.initializeApp();

//Server configuration
const PORT = 3000;

//Initialize The Admin-SDK (configuration)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://storit-28df0.firebaseio.com"
});

//idToken comes from the client app
admin.auth().verifyIdToken(idToken)
  .then(function(decodedToken) {
    let uid = decodedToken.uid;

    console.log('Successfully Authenticated');

  }).catch(function(error) {
  	
     console.log('Access Denied', error);
  });


//create connection
const con = mysql.createConnection({
	host : 'localhost',
	user :  'root',
	password : 'MyNewPass',
	database : 'ip_addresses'
}); 

//connect to the database
con.connect (function(error){
	if(error){
	   console.log('error:'+ error);
	}
	   console.log('Connected to database');
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

//insert post 1 to the table
app.get('/addpost1', (req, res) => {
	var post  = {serverName:'Firstserver', ip_address: '127.0.0.1' };
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

//select and get a post from the table
app.get('/getpost/:id', (req, res) => {
	let sql = `SELECT * FROM PostTable WHERE id = ${req.params.id}`;
	let query = con.query(sql, (err, result) =>{
		if (err) {
			console.log(err);
		}
			console.log(result);
			res.send('Post Fetched');
	});
}); 

//Create app listener 
app.listen(PORT, () => {
	console.log('Server running at: http://localhost:'+ PORT);
});



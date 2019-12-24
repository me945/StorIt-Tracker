var path = require('path')
var mangoose = require('mangoose')

var express = require('express');
var app = express ();

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function(){
	console.log("Connected to database")
});
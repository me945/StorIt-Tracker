//create new express and save it in app
var express = require('express');
var app = express ();

//Server configuration
const PORT = 8080;


app.get("/", function(req ,res){
	Subject.find(function(error,silence){
		if (error)
			return console.error(error);
		res.send(silence);
	});
});

app.get("/hello", function(req ,res){
	res.send("Sup dude")
});

app.post("/", function(req ,res){
	res.send("Sup dude")
});

//Create app listener 
app.listen(PORT, () =>{
	console.log('Server running at: http://localhost:${PORT}');
});


app.get('/',(req, res) => {
	res.send('Hello World');
});




// // //checks if the server is connected to the database and retuens a message
// // var db = mongoose.connection;
// // db.on('error', console.error.bind(console, 'connection error'));
// // db.once('open', function(){
// // 	console.log("Connected to database")
// // });
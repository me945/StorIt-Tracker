const mysql = require('mysql');
// var serverID = mysql.serverID;


//if it connectes it creates a database
		var sql = 'create database ip_addresses';
		con.query(sql, (err,result) => {
			if (err) {
				console.log(err);
			}
				console.log(result);
				console.log('Database created');
		});
		//create table in the database
		var sql = 'Create table ip_addresses.PostTable(id int AUTO_INCREMENT, serverName VARCHAR(50), ip_address VARCHAR(50) ,PRIMARY KEY (id))';
		con.query(sql, (err,result) => {
			if (err) {
			console.log(err);
			}
			console.log(result);
			console.log('Post table created');
		});
		
// var newServer = new serverID ({
// 	ipAddress: INET_ATON()
// });

// module.exports = mysql.module();
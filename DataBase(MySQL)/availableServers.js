const mysql = require('mysql');
var serverID = mysql.serverID;

var newServer = new serverID ({
	ipAddress: INET_ATON()
});

module.exports = mysql.module();
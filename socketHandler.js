module.exports = function(io, con, admin){
  //socket middleware
  // io.use((socket,next)=>{
  //   if (req.headers.authorization 
  //     && req.headers.authorization.split (' ')[0] === 'Bearer') {
  //     req.authtoken = req.headers.authorization.split(' ')[1];
  //   } else {
  //     req.authtoken = null;
  //   }
  //   next();
  // });


  io.on('connection', function(client) {

    client.use(async function(socket, next) {
      console.log("middleware", socket[1].token);
      if(socket[0] === "addserver" || socket[0] == "upload" || socket[0] === "download") 
      {
        try {
          const authToken = socket[1].token;
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
      }
    });
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
      let sql = `SELECT ServerID, socketId FROM Server;`;
      let query = con.query(sql, (err1, result1) => {
        if (err1) {
          console.log(err);
        } else {
           console.log(result1);
           console.log(result1[0].ServerID);
           // file placement occurs here
           // verify file can be placed

          let post  = {uid:details.authId};
          let sql = "INSERT INTO File SET ?";
          let query = con.query(sql,[post], (err2, result2) => {
            if (err2) {
             console.log(err2);
            } else {
             console.log(result2.insertId);
             var chunkSize = details.size / result1.length;
             // should probably promisify
             for(var i = 0;i < result1.length;i++) {
               var post  = {uid: details.authId, ServerID: result1[i].ServerID, FileID: result2.insertId, chunkSize: chunkSize};
               let sql = "INSERT INTO Chunk SET ?";
               let query = con.query(sql,[post], (err3, result3) => {
                  if (err3) {
                    console.log(err3);
                  } else {
                    console.log(result3);
                  }
                });
             }
             client.emit("uploadList", result1, result2.insertId);
            }
          });
        }
      });
      
      
  	 })

  	client.on('download', function(details){
      // take file id and get all socket id for that file
      let sql = `SELECT socketId FROM Server S Inner JOIN Chunk C ON S.ServerID = C.ServerID Where C.FileID = ${details.fileId} `;
      let query = con.query(sql, function(err, result){
      if (err) {
        console.log(err);
      } else {

        client.emit("downloadList", result);
        console.log(result);
      }
      });

    });

  	client.on('addserver', function(details) {
      let post = {
                  'ServerID': details.deviceId, 
                  'uid': details.authId,
                  'storageAmount': details.size,
                  'socketId': client.id
                 };
      let socketUpdate = {
        'socketId': client.id
      };
      let sql = `INSERT INTO Server SET ? ON DUPLICATE KEY UPDATE ?;`;
      let query = con.query(sql,[post, socketUpdate], function(err, result){
        if (err){
        	// socket.emit('Error'+err);
        	console.log('Error'+err);
        }
        else{
        	console.log('server is Inserted into the database');
        }
      });
    });

  	client.on('disconnect', function(){
  		// client.emit('Disconnected');
  		console.log('user disconnected from the server');
  	});
  });
}
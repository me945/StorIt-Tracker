var placeFile = require('./placementAlgo.js');


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
  


  console.log("client with id " + client.id + " is connected");
    client.use(async function(socket, next) {
      console.log("middleware", socket[1].token);
      if(socket[0] === "addserver" || socket[0] === "upload" || socket[0] === "download" || socket[0] === "addclient") 
      {
        try {
          const authToken = socket[1].token;
          console.log("authenticated", authToken);
          const userInfo = await admin
            .auth()
            .verifyIdToken(authToken);
          console.log("authenticated", userInfo.uid);
          socket[1].authId = userInfo.uid;
          next();
        } catch (e) {
          console.log("not authenticated");
          console.log(e.message);
          res
            .status(401)
            .send({ error: 'You are not authorized to make this request' });
        }
      } 
      else {
  next();
  }
    });
    client.on('message', function (details) {
      
      var otherClient = io.sockets.connected[details.to];
      if (!otherClient) {
        console.log("no such other client");
        return;
      }
      delete details.to;
      details.from = client.id;
      otherClient.emit('message', details);
    });

    client.on('upload', function(details){
      // // get user plan
      // var userQuery = firebase.database().ref('Users/' + details.authId);
      // userQuery.on('value', function(snapshot) {
      //   var userDetails = snapshot.val();
      //   console.log("userDetails = " + userDetails);
        // once u get the plan
        // for each region u need to find apt servers
        // get a list of all the servers
        // place the servers
      placeFile(con, details.regions, details.authId, details.fileSize, client);

     });

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
                  'serverId': details.deviceId, 
                  'uid': details.authId,
                  'name': details.name,
                  'storage': details.storage,
                  'availableStorage': details.storage,
                  'location': details.id,
                  'status': "available",
                  'totalDownTime': 0,
                  'currentDownTime': 0,
                  'lastChecked': new Date(),
                 };
      let socketUpdate = {
        'location': client.id
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
    client.on('addclient', function(details) {
      let post = {'uid': details.authId,
                  'location': details.id,
                 };
      let socketUpdate = {
        'location': client.id
      };
      let sql = `INSERT INTO Client SET ? ON DUPLICATE KEY UPDATE ?;`;
      let query = con.query(sql,[post, socketUpdate], function(err, result){
        if (err){
          // socket.emit('Error'+err);
          console.log('Error'+err);
        }
        else{
          console.log('client is Inserted into the database');
        }
      });
    });

    client.on('disconnect', function(){
      // client.emit('Disconnected');
      console.log('user disconnected from the server');
    });
  });
}

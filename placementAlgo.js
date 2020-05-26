var geoip = require('geoip-lite');
function distance(lat1, lon1, lat2, lon2, unit) {
  if ((lat1 == lat2) && (lon1 == lon2)) {
    return 0;
  }
  else {
    var radlat1 = Math.PI * lat1/180;
    var radlat2 = Math.PI * lat2/180;
    var theta = lon1-lon2;
    var radtheta = Math.PI * theta/180;
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = dist * 180/Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit=="K") { dist = dist * 1.609344 }
    if (unit=="N") { dist = dist * 0.8684 }
    return dist;
  }

}
function getIp(socket) {
  let ip = _.has(socket.handshake.address, 'address') 
              ? socket.handshake.address.address 
              : socket.handshake.address;
    if (ip === "127.0.0.1") {
      ip = _.has(socket.handshake.headers, 'x-real-ip') 
                ? socket.handshake.headers['x-real-ip'] 
                : socket.handshake.headers['x-forwarded-for'];
    }
    return ip;
}

function calculateDistance(socketId, serverSocketId) {
    var socket = io.sockets.connected[socketId];
    var serverSocket = io.sockets.connected[serverSocketId];
    let ip = getIp(socket);
    let serverip = getIp(serverSocket);
    var geo = geoip.lookup(ip);
    var serverGeo = geoip.lookup(serverip);
    var currDistance = distance(geo.ll[0], geo.ll[1], serverGeo.ll[0], serverGeo.ll[1], "K"); 
    return currDistance;
}

function convertToContinent(country) {
    var ctryToCnt = {"EU":["AD","AL","AT","AX","BA","BE","BG","BY","CH","CZ","DE","DK","EE","ES","EU","FI","FO","FR","FX","GB","GG","GI","GR","HR","HU","IE","IM","IS","IT","JE","LI","LT","LU","LV","MC","MD","ME","MK","MT","NL","NO","PL","PT","RO","RS","RU","SE","SI","SJ","SK","SM","TR","UA","VA"],"AS":["AE","AF","AM","AP","AZ","BD","BH","BN","BT","CC","CN","CX","CY","GE","HK","ID","IL","IN","IO","IQ","IR","JO","JP","KG","KH","KP","KR","KW","KZ","LA","LB","LK","MM","MN","MO","MV","MY","NP","OM","PH","PK","PS","QA","SA","SG","SY","TH","TJ","TL","TM","TW","UZ","VN","YE"],"NA":["AG","AI","AN","AW","BB","BL","BM","BS","BZ","CA","CR","CU","DM","DO","GD","GL","GP","GT","HN","HT","JM","KN","KY","LC","MF","MQ","MS","MX","NI","PA","PM","PR","SV","TC","TT","US","VC","VG","VI"],"AF":["AO","BF","BI","BJ","BW","CD","CF","CG","CI","CM","CV","DJ","DZ","EG","EH","ER","ET","GA","GH","GM","GN","GQ","GW","KE","KM","LR","LS","LY","MA","MG","ML","MR","MU","MW","MZ","NA","NE","NG","RE","RW","SC","SD","SH","SL","SN","SO","ST","SZ","TD","TG","TN","TZ","UG","YT","ZA","ZM","ZW"],"AN":["AQ","BV","GS","HM","TF"],"SA":["AR","BO","BR","CL","CO","EC","FK","GF","GY","PE","PY","SR","UY","VE"],"OC":["AS","AU","CK","FJ","FM","GU","KI","MH","MP","NC","NF","NR","NU","NZ","PF","PG","PN","PW","SB","TK","TO","TV","UM","VU","WF","WS"],"--":["O1"]};
    for(var continent in ctryToCnt) {
        if(ctryToCnt[continent].indexOf(country) != -1) {
            return continent;
        }
    }
    return "AN";
}
function getRegion(location) {
    let socket = io.sockets.connected[location];
    let ip = getIp(socket);
    var geo = geoip.lookup(ip);
    var serverGeo = geoip.lookup(serverip);
    return convertToContinent(serverGeo.country);
}
function placeFile(con, regions, userId, fileSize, client) {
    con.query("select * from Server for update skip locked;", function(err, result0) {
        if(err) { 
            throw err;
        }
        else {
            // for any server in serverlist // calculate and set distance
            console.log(result0.length);
            
            for(var i = 0;i < result0.length;i++) {
                result0[i].distance = calculateDistance(i+1, "damn");//result0[i].location);
            }
            for(var i = 0;i < result0.length;i++) {
                result0[i].region = getRegion(result0.location);//result0[i].location);
            }
            console.log(result0);
            
            // console.log(placementAlgorithm(serverList, fileSize, regions));
            
            var finalList = placementAlgorithm(result0, fileSize, regions);
            console.log(finalList);
            
            // if it failed then rollback and call the function again

            // if(finalList == false) {
            //     return false;
            // }
            // get placement servers
            con.beginTransaction(function(err) {
                if (err) { throw err; }
                // try selecting for update
                var updatedServers = [];
                for(var i = 0;i < finalList.length;i++) {
                    for(var j = 0;j < finalList[i].length;j++) {
                        if(updatedServers.indexOf(finalList[i][j][0]) == -1) {
                            updatedServers.push(finalList[i][j][0]);
                        }
                    }
                }

                let sql = "select * from Server where ServerId=?";

                for(i = 1;i < updatedServers.length;i++) {
                    sql += " OR ServerId=? ";
                }

                 sql += " for update skip locked;";


                let query = con.query(sql,updatedServers, (err2, result2) => {
                    if (err2) {
                        console.log(err2);
                    } else {
                        console.log(result2);
                        console.log(result2.insertId);
                        // con.rollback((err)=>{
                        //     if(err) {throw err;}
                        //     con.end(function(err) {
                        //         console.log(err);
                        //     });
                        // });


                        if(updatedServers.length != result2.length) {
                            // roll back
                            // return false
                            con.rollback((err)=>{
                                if(err) {throw err;}
                                placeFile(con, regions, userId, fileSize, client);
                                // con.end(function(err) {
                                //     console.log(err);
                                // });
                            });
                            
                        } else {


                            var promiseList = [];
                            // for every in serverList
                            for(var i = 0;i < result0.length;i++) {
                                // if the server is in updated servers
                                if(updatedServers.indexOf(result0[i].serverId) != -1) {
                                    promiseList.push(new Promise((resolve, reject) =>{
                                        console.log("run");
                                        var updateParam = [result0[i].storage, result0[i].serverId];
                                        var updateQuery = "update server set storage = ? where ServerId = ? ;"
                                        con.query(updateQuery, updateParam, (err4, result4) => {
                                            if (err4) {
                                                console.log(err4);
                                            } else {
                                                resolve("success");
                                            }
                                        });
                                    }));
                                }
                            }
                             // update server table update server set storage = serverList[i].storage where serverId = serverList[i].serverId;
                           // once done commit
                           // we only commit once all
                            Promise.all(promiseList).then((values) => {
                                console.log("values " + values);
                                con.commit(function(err) {
                                    if (err) {
                                        return connection.rollback(function() {
                                            throw err;
                                        });
                                    } else {
                                        let InsertFileSql = "Insert into File set ?";
                                        let InsertFilePost = {'fileId': 0,'uid':  userId};
                                        con.query(InsertFileSql, InsertFilePost, (err2, result2) => {
                                            console.log(result2);
                                            if (err2) {
                                                console.log(err2);
                                            } else {
                                                for(var j = 0;j < finalList[0].length;j++) {
                                                   let insertChunkSql = "Insert into Chunk set ?";
                                                   let insertChunkPost = {
                                                                       'chunkId': 0,
                                                                       'serverId': finalList[0][j][0], 
                                                                       'fileId': result2.insertId,
                                                                       'chunkSize': finalList[0][j][1]
                                                                     };
                                                    con.query(insertChunkSql, insertChunkPost, function(j,err3, result3) {
                                                        console.log(result3);
                                                        if (err3) {
                                                            console.log(err3);
                                                        } else {
                                                            // for every other entry
                                                            for(var i = 1;i < finalList.length;i++) {
                                                                // insert in chunks table
                                                                console.log("j = " + j + " i = " + i);
                                                                let insertChunkSql = "Insert into Chunk set ?";
                                                                 let insertChunkPost = {
                                                                                       'chunkId': 0,
                                                                                       'serverId': finalList[i][j][0], 
                                                                                       'fileId': result2.insertId,
                                                                                       'chunkSize': finalList[i][j][1]
                                                                                     };
                                                                con.query(insertChunkSql, insertChunkPost, (err2, result4) => {
                                                                    console.log(result4);
                                                                    if (err2) {
                                                                        console.log(err2);
                                                                    } else {
                                                                       let insertBackupSql = "Insert into Backup set ?";
                                                                       let insertBackupPost = { // chunkid, backupchunkid
                                                                                            'backupId': 0,
                                                                                           'chunkId': result3.insertId,
                                                                                           'backupChunkId': result4.insertId
                                                                                         };
                                                                        con.query(insertBackupSql, insertBackupPost, (err5, result5) => {
                                                                            if (err3) {
                                                                                console.log(err5);
                                                                            }  
                                                                            // done?
                                                                            console.log("done");
                                                                            if(i == finalList.length - 1 && j == finalList[i].length) {
                                                                                // con.end((err)=>{});
                                                                                client.emit("uploadList", finalList);
                                                                            }
                                                                           
                                                                        });    

                                                                    }

                                                                });
                                                            }
                                                        } 
                                                    }.bind(this, j));                    
                                                }
                                                
                                            }

                                        });
                                    }
                                });
                            });
                        }
                    }
                });
            });
        }
    });

}            
//                // change serverid to location?
//                // insert first entry to file table
//                // insert first entry to chunks table
//                // for every other entry
//                // insert in chunks table
//                // insert into backup table
// // select * from Server where ServerId=? or serverId=?...for every server in serverList[sid, sid, sid]
// // if any of the servers are missing
// // rollback
// // else   23r33  

// // replace every server id with location in final list
// // update the server table
// // commit
// // replace every server id with location in final list
// // insert first entry to file table
// // insert first entry to chunks table
// // for every other entry
// // insert in chunks table
// // insert in backup table

// // send back to client



// console.log(JSON.stringify(serverList, null, 2));
function placementAlgorithm(serverList, fileSize, regions) {
  // for every region
  // sum up the storage 

  var sumRegion = {};
  for(var i = 0;i < regions.length;i++) {
    if(i == regions.indexOf(regions[i])) {
      sumRegion[regions[i]] = 0;
    }
  }
  for(var i = 0;i< serverList.length;i++) {
    sumRegion[serverList[i].region] += serverList[i].storage;
  }
  for(var i = 0;i < regions.length;i++) {
    sumRegion[serverList[i].region] -= fileSize;
    if(sumRegion[serverList[i].region] < 0) {
      
      console.log("file failed to fit");
      console.log("use aws instead");
      return [];
    }
  }
  var initialNumChunks = 0;
  var newServerList = [];
  if(fileSize <= 50000000) {
    initialNumChunks = 1;
  } else if(fileSize <= 200000000) {
    initialNumChunks = 2;
  } else if(fileSize <= 500000000) {
    initialNumChunks = 3;
  } else if(fileSize <= 1000000000) {
    initialNumChunks = 4;
  } else {
    initialNumChunks = 4;
  }
  if(initialNumChunks > serverList.length) {
    initialNumChunks = serverList.length;
  }
  var maxStorage = 0, maxDistance = 0, maxDownTime = 0;
  var minStorage = serverList[0].storage, minDownTime = serverList[0].totalDownTime;
  var minDistance = 20000;
  var fileFits = false;
  var w1 = 0.2, w2 = 0.6, w3 = 0.2;
  var maxList = [];
  var minList = [];
  // create a list for each region
  for(var i = 0;i < regions.length;i++) {
    if(i == regions.indexOf(regions[i])) {
      newServerList.push([]);
      maxList.push([0, 0, 0]);
      minList.push([10000000000, 200000, 20000]);
    }
  }
  // find all maximum and minimums
  // when we copy to newserverlist, we need to copy only unique regions
  for(var i = 0;i < serverList.length;i++) {
      var currIndex = regions.indexOf(serverList[i].region);
      if(currIndex != -1) {
        // calculate distance
        var servDistance = serverList[i].distance;//calculateDistance(details.id, serversList[i].location);
        var storage =  serverList[i].storage;
        var downTime = serverList[i].totalDownTime;
        var location = serverList[i].location;
        var serverId = serverList[i].serverId;
        // storage
        // max server downtime
        newServerList[currIndex].push({'distance': servDistance,
                            'storage': storage,
                            'currStorage':storage,
                            'downTime': downTime,
                            'location': location,
                            'serverId': serverId});
        if(servDistance > maxList[currIndex][2]) {
          maxList[currIndex][2] = servDistance;
        }
        if(servDistance < minList[currIndex][2]) {
           minList[currIndex][2] = servDistance;
        }
        if(storage > maxList[currIndex][0]) {
          maxList[currIndex][0] = storage;
        }
        if(storage < minList[currIndex][0]) {
           minList[currIndex][0] = storage;
        }
        if(downTime > maxList[currIndex][1]) {
          maxList[currIndex][1] = downTime;
        }
        if(downTime < minList[currIndex][1]) {
           minList[currIndex][1] = downTime;
        }
      }
  }
  // normalize all the data to between 0 and 100
  var newMin = 1, newMax = 100;
  var minRegionLength = newServerList[0].length;
  for(var i = 0;i < newServerList.length;i++) {
    var maxDistance = maxList[i][2], minDistance = minList[i][2];
    var maxStorage = maxList[i][0], minStorage = minList[i][0];
    var maxDownTime = maxList[i][1], minDownTime = minList[i][1];
    var oldDistanceRange = (maxDistance - minDistance);
    var oldStorageRange = (maxStorage - minStorage);
    var oldDownTimeRange = (maxDownTime - minDownTime);
    for(var j = 0;j < newServerList[i].length;j++) {
      if (oldDistanceRange == 0)
          newServerList[i][j].distance = minDistance;
      else
      {
          var newRange = (newMax - newMin);  
          newServerList[i][j].distance = newMax - (((newServerList[i][j].distance - minDistance) * newRange) / oldDistanceRange) + newMin;
          newServerList[i][j].distance = newServerList[i][j].distance;
      }
      if (oldStorageRange == 0)
          newServerList[i][j].newStorage = minStorage;
      else
      {
          var newRange = (newMax - newMin);  
          newServerList[i][j].newStorage = ((((newServerList[i][j].storage - minStorage) * newRange) / oldStorageRange) + newMin);
          newServerList[i][j].newStorage = newServerList[i][j].newStorage;
      }
      if (oldDownTimeRange == 0)
          newServerList[i][j].downTime = minDownTime;
      else
      {
          var newRange = (newMax - newMin);  
          newServerList[i][j].downTime = newMax - ((((newServerList[i][j].downTime - minDownTime) * newRange) / oldDownTimeRange) + newMin);
          newServerList[i][j].downTime = newServerList[i][j].downTime;
      }
    }
    // get minimum region server length
    if(newServerList[i].length < minRegionLength) {
      minRegionLength = newServerList[i].length;
    }
  }
  // // calculate quality for each region
  // // calculate the avg quality across all the server regions across all regions
  // // sort the regions
  // // pick top n
  // // check if it fits across all regions
  // // repeat increasing w2 and num of chunks
  // var finalList = {};


  while(!fileFits && (initialNumChunks <= minRegionLength && w2 <= 1)) {
    // calculate quality for each region
    for(var i = 0;i < newServerList.length;i++) {
      for(var j = 0;j < newServerList[i].length;j++) {
        newServerList[i][j].quality = (newServerList[i][j].distance * w1) + (newServerList[i][j].newStorage * w2) + (newServerList[i][j].downTime * w3);
      }
      // sort each region descendingly
      newServerList[i].sort((a, b) => b.quality - a.quality);
    }
    // for maybe the smallest region
    // from 0 - 4, add all quality and divide by 4
    // then from 0 - 4, add all quality and divide by 4
    var avgList = [];
    // calculate the avg quality across all the server regions across all regions
    for(var i = 0;i < minRegionLength;i++) {
      var avg = 0;
      for(var j = 0;j < newServerList.length;j++) {
          avg += newServerList[j][i].quality;
      }
      avg /= newServerList.length;
      for(var j = 0;j < newServerList.length;j++) {
          newServerList[j][i].averageQuality = avg;
      }
      avgList.push(avg);
    }
    fileFits = true;
    // console.log(newServerList)
    finalList = [];
    var qSum = 0;
    for(var i = 0;i < initialNumChunks;i++) {
      qSum += avgList[i];
    }
    // we have set the avg q for each item
    // now we just copy the results to the finalList
    //and ensure it fits for all the regions
    for(var i = 0;i < regions.length;i++) {
      var index = regions.indexOf(regions[i]);
      if(index != i) {
        // recalculate quality
        for(var j = 0;j < newServerList[index].length;j++) {
          newServerList[index][j].quality = (newServerList[index][j].distance * w1) + (newServerList[index][j].newStorage * w2) + (newServerList[index][j].downTime * w3);
        }
        // sort each region descendingly by the quality
        newServerList[index].sort((a, b) => b.quality - a.quality);
      }
      finalList[i] = [];
      for(var j = 0;j < initialNumChunks;j++) {
        finalList[i].push([newServerList[index][j].serverId, Math.round((avgList[j] * fileSize) / qSum)]);
        if(finalList[i][j][1] > newServerList[index][j].storage) {
          if(w2 < 1 && initialNumChunks < minRegionLength) {
            initialNumChunks++;
            w2 = ((w2 * 100) + (0.10 * 100))/100;
            w1 = ((w1 * 100) - (0.05 * 100))/100;
            w3 = ((w3 * 100) - (0.05 * 100))/100;
          } else {
            if(w2 === 1) {
              initialNumChunks++;
            } else if(initialNumChunks === minRegionLength) {
              w2 = ((w2 * 100) + (0.10 * 100))/100;
              w1 = ((w1 * 100) - (0.05 * 100))/100;
              w3 = ((w3 * 100) - (0.05 * 100))/100;
            } 
          }
          fileFits = false;
          break;
        } else {
          // reduce the st
          newServerList[index][j].storage -= finalList[i][j][1];
        }
      } 
      if(!fileFits) {
        break;
      }
    }
    // console.log(newServerList);
    // for every server in the final list
    // add the storage back to the server in newserverlist
    if(!fileFits) {
      for(var i = 0;i <newServerList.length;i++) {
        for(var j = 0;j < newServerList[i].length;j++) {
          newServerList[i][j].storage = newServerList[i][j].currStorage;
        }
      }
    }
    //can u put newserverlist back to it's original stuff
    //how?
    // option 1 make a copy and just set it to that
    // option 2 add the subtracted value from finallist back to newserverlist
    // option 3 copy it from serverList
    //option 2 looks the best!!!!!!!
  }
  if(fileFits) {
    // reduce any used memory
    for(var i = 0;i < serverList.length;i++) {
      for(var j = 0;j < finalList.length;j++) {
        for(var k = 0;k < finalList[j].length;k++) {
          // console.log(location)
          if(finalList[j][k][0] === serverList[i].serverId) {
             serverList[i].storage -= finalList[j][k][1];
          }
        }
      }
    }
  } else {
    console.log("file failed to fit");
    console.log("use aws instead");
    return {};
  }   

  return finalList;

}
module.exports = placeFile;
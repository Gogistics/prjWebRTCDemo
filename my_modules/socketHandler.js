module.exports = function(io, streams) {
  // socket.io connection callback when a new user visit the website
  io.on('connection', function(client) {
    console.log('-- ' + client.id + ' joined --');
    client.emit('id', client.id); // notify all users the id of new visitor

    // receiver of message; socket.io message callback when new message come in
    client.on('message', function (details) {
      var otherClient = io.sockets.connected[details.to];
      if (!otherClient) return false;
      delete details.to;
      details.from = client.id; // replace the id of "from" with the sender's id
      otherClient.emit('message', details); // notify all users
    });
      
    // receiver of readyToStream notification; the web server and others get notified when a new user is ready for rtc service
    client.on('readyToStream', function(options) {
      console.log('-- ' + client.id + ' is ready to stream --');
      var user_ip = client.request.connection.remoteAddress || 'NA';

      // add new info of socket stream to MongoDB when new visitor is ready
      streams.addStream(client.id, options.name, options.user_type, user_ip, function(err, doc){
        if(err) console.log(err);
      });

      // send notification to all users when new stream coming; notify user-self & need to notify other users
      // client.emit('streamNotification', 'stream_on')
      notifyUsersWithUpdateStreamsInfo('stream_on', client.id);
    });
    
    // receiver of update; update the doc of MongoDB
    client.on('update', function(options) {
      streams.update(client.id, options.name, options.user_type, function(err, result){
        if(err) console.log(result);
      });
    });

    // receiver of service notification; notify others with news from the users
    client.on('serviceNotification', function(arg_details){
      var client_to = io.sockets.connected[arg_details.to];
      if(!client_to) return false;
      arg_details['from'] = client.id;
      console.log(arg_details);
      client_to.emit('serviceNotification', arg_details);
    });

    function leave(arg_info) {
      console.log('-- ' + client.id + ' left --');
      streams.removeStream(client.id, function(err, result){
        if(err) console.log(result);
      });

      // send notification to all users when stream leaves
      // client.emit('streamNotification', 'stream_off');
      notifyUsersWithUpdateStreamsInfo('stream_off', client.id);
    }

    // notification to update stream list and video conatiner
    function notifyUsersWithUpdateStreamsInfo(arg_notification_key, arg_client_id_from){
      var clients = io.sockets.connected;
      if(!clients || clients.length === 0){
        return false;
      }
      for(var key in clients){
        console.log('socket-key: ' + key);
        clients[key].emit('streamNotification', { notification_key: arg_notification_key, client_id_from: arg_client_id_from });
      }
    }

    // disconnect and leave receiver; "disconnect" and "leave" function the same way in this tutorial
    client.on('disconnect', leave);
    client.on('leave', leave);
  });
};

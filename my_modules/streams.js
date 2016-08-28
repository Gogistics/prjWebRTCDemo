module.exports = function() {
  /*
  * MongoDB Config.
  */
  var MongoClient = require('mongodb').MongoClient,
    assert = require('assert'),
    webRTCCollection;

  var url = 'mongodb://webrtc_user:HappyWebRTC@45.79.106.150:27025/webrtc';
  // Use connect method to connect to the Server 
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to the server");
    socketCollection  = db.collection('socket');
  });

  /*
   * Stream object
   */
  // root class
  var Stream = function(arg_id, arg_name, arg_user_type, arg_user_ip, arg_time_log_in) {
    this.name = arg_name;
    this.id = arg_id;
    this.user_type = arg_user_type; // will be used for filtering users
    this.user_ip = arg_user_ip; // for tracking user ip
    this.time_log_in = arg_time_log_in; // will be used for queue
  }

  // admin Stream
  var WebRTCStream = function(arg_id, arg_name, arg_user_type, arg_user_ip, arg_time_log_id){
    //
    Stream.call(this, arg_id, arg_name, arg_user_type, arg_user_ip, arg_time_log_id);
    this.servedWatchers = [];
  }
  WebRTCStream.prototype = Object.create(Stream.prototype);
  WebRTCStream.prototype.constructor = WebRTCStream;

  // returned obj
  return {
    // add new stream
    addStream : function(arg_id, arg_name, arg_user_type, arg_user_ip, callback) {
      if(arg_user_type === 'watcher' || arg_user_type === 'broadcast'){
        var time_log_in = new Date(),
            stream = new WebRTCStream(arg_id, arg_name, arg_user_type, arg_user_ip, time_log_in);
        console.log(stream);
        socketCollection.findAndModify(
          { id: stream.id },
          [['id', 1]],
          { $setOnInsert: stream },
          { new: true, upsert: true },
          function(err, doc){
            callback(err, doc);
        });
      }else{
        callback('invalid user type', {});
      }
    },

    // remove stream
    removeStream : function(arg_id, callback) {
      // update collection of stream log
      socketCollection.deleteOne({ id : arg_id }, function(err, result) {
        callback(err, result);
      });
    },

    // update function
    update : function(arg_id, arg_name, arg_user_type, callback) {
      if(arg_user_type === 'watcher' || arg_user_type === 'broadcast'){
        socketCollection.updateOne({id: arg_id}, {$set: {name: arg_name}}, function(err, result){
          callback(err, result);
        });
      }else{
        callback('invalid user type', {});
      };
    },

    // get stream list; may be unnecessary for using cloud db
    getStreams : function(arg_user_type, callback) {
      if(arg_user_type === 'watcher' || arg_user_type === 'broadcast'){
        socketCollection.find({user_type: arg_user_type}).sort({id: 1}).toArray(function(err, docs){
          callback(err, docs);
        });
      }else{
        callback('invalid user type', []);
      };
    }
  }
};

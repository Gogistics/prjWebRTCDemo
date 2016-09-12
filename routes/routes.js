module.exports = function(app, streams) {

  // GET index 
  var index = function(req, res) {
    var params = { title: 'WebRTC Demo' };
    res.render('index.jade', params);
  };

  // GET watcher
  var watcher = function(req, res){
    var params = { ttile: 'Watcher', user_type: 'watcher'};
    res.render('watcher.jade', params);
  }

  // GET broadcast
  var broadcast = function(req, res){
    var params = { ttile: 'Broadcast', user_type: 'broadcast'};
    res.render('broadcast.jade', params);
  }

  // GET streams as JSON
  var getStreams = function(req, res){
    var user_type = req.body.user_type || 'broadcast';
    streams.getStreams(user_type, function(err, docs){
      if(!err){
        res.status(200).json({broadcastStreams: docs});
      }else{
        res.status(500).json([]);
      }
    });
  };

  var getWatchers = function(req, res){
    var broadcast_info = req.body;
    streams.getWatchers(broadcast_info['id'], function(err, docs){
      if(!err){
       res.status(200).json({watchers: docs});
      }else{
        res.status(500).json([]);
      }
    });
  }

  // set GET for login
  app.get('/', index);

  // watcher
  app.get('/watcher', watcher);

  // broadcast
  app.get('/broadcast', broadcast);

  // get stream info. in JSON
  app.post('/streams', getStreams);

  // get watchers
  app.post('/get-watchers', getWatchers);
}
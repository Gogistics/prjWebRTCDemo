module.exports = function(app, streams) {

  // GET index 
  var index = function(req, res) {
    var params = { title: 'WebRTC Demo' };
    res.render('index.jade', params);
  };

  var watcher = function(req, res){
    var params = { ttile: 'Watcher'};
    res.render('watcher.jade', params);
  }

  var broadcast = function(req, res){
    var params = { ttile: 'Broadcast'};
    res.render('broadcast.jade', params);
  }

  // GET streams as JSON
  var getStreams = function(req, res){
    var user_type = req.params.user_type || 'watcher';
    streams.getStreams(user_type, function(err, docs){
      if(!err){
        res.send(docs);
      }else{
        res.send([]);
      }
    });
  };

  // set GET for login
  app.get('/', index);

  // watcher
  app.get('/watcher', watcher);

  // broadcast
  app.get('/broadcast', broadcast);

  // get stream info. in JSON
  app.get('/streams', getStreams);
}
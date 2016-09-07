/**/
/* main.js hosts the app */
const express = require('express'),
    session = require('express-session'),
    cookieParser = require('cookie-parser'),
    path = require('path'),
    streams = require('./my_modules/streams.js')(),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    methodOverride = require('method-override'),
    bodyParser = require('body-parser'),
    errorHandler = require('errorhandler'),
    app = express(),
    cache_time = 1 * 86400000,
    redis   = require("redis"),
    redisStore = require('connect-redis')(session),
    client  = redis.createClient();

// start app
initApp();

/* init the app server */
function initApp(){
  app.set('port', process.env.PORT || 8000);
  app.set('views', path.join(__dirname, 'views'));
  app.set('views engine', 'jade');
  app.use(favicon(__dirname + '/public/imgs/icons/favicon.ico'));
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(methodOverride());

  // set session & cookie; here we use Redis to handle session management
  app.use(cookieParser('C1J43I8UDHSBDC4N6SYE83W726SG4GD84JD9S7HA'));
  app.use(session({
    secret: 'C1J43I8UDHSBDC4N6SYE83W726SG4GD84JD9S7HA',
    store: new redisStore({
      host: 'localhost',
      port: 6378,
      pass: 'CJDC934FGHSHD7ZM23R98UV100SDZNP09',
      client: client,
      ttl : 3600000
    }),
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true, maxAge: 600000, httpOnly: true }
  }));

  // set static paths
  app.use('/public', express.static( path.join(__dirname, '/public'), { maxAge: cache_time}));
  app.use('/videos', express.static( path.join(__dirname, '/my_binaryjs/videos'), { maxAge: cache_time}));

  // dev. only
  if('development' === app.get('env')){
    app.use(errorHandler());
  }

  // set routers
  var myRouter = require('./routes/routes.js');
  myRouter(app, streams); // add app and streams

  // set port for server to listen
  var appServer = app.listen(app.get('port'), function(){
    console.log('Express server listening on port: ' + app.get('port'));
  });

  // set socket handlers
  var io = require('socket.io').listen(appServer); // make socket.io listen to port 8000
  require('./my_modules/socketHandler.js')(io, streams); // pass socket.io and stream into stream handler
}

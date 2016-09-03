var binaryServer = require('binaryjs').BinaryServer,
    server = binaryServer({port: 8888, chunkSize: 81920}),
    fs = require('fs'),
    exec = require('exec');

server.on('connection', function(client) {
   //
   var file_writer = null;
   client.on('stream', function(stream, meta){
      // console.log(meta);
      var timestamp = new Date().getTime();
      file_writer = fs.createWriteStream( __dirname + '/videos/' + timestamp + '.webm');
      stream.pipe(file_writer);

      console.log(server.clients);
      console.log(stream._socket._socket.ondata);

      stream.on('data', function(data){
         console.log(data);
      });

      // file_writer
      stream.on('end', function() {
         file_writer.end();
      });
   });
   //
   client.on('close', function(){
      if(file_writer !== null){
         // end file_writer
         file_writer.end();
      }
   });
});

server.on('error', function(err){
   //
   console.log(err);
});

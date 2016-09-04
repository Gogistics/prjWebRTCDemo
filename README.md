# WebRTC Tutorial

How WebRTC works? (by Minko Gechev)

![Sequence WebRTC by Minko Gechev](http://blog.mgechev.com/images/yeoman-angular-webrtc/sequence-webrtc.png)

Prerequisites:
  
  Web server, database, socket handler, WebRTC adapter, etc. In this demo, Node.js and Express.js are used to build the web server, nginx is used as the proxy server handling load balancing, standalone MongoDB is used as the database to store socket information, Redis is used to handle session information, socket.io is used to handle socket channel, official adapter.js is the WebRTC adapter, Angular.js is used to construct the front-end MVC architecture, and so on.

Demo 1. Broadcasting with recording mechanism (Chrome/Firefox)

  1-1. **Initiate a Node.js project:**

  See package.json as the reference of required modules

  1-2. **Back-end Development:** 

  Get streams.js and socketHandler.js ready, before creating a server.js; streams handles the stream information and conmmunication with the database which is MongoDB in our case, and socketHandler.js handles the communication  between streams.js and socket.io

  1-3. **Front-end Development:**

  Start to construct the front-end architecture built with angular.js, socket.io-client, WebRTC adapter.js, and rtcClient.js; angular.js is used to construct front-end MVC architecture, socket.io-client is used to handle the socket comminucation between front-end and back-end, adapter.js is an interface to handle RTC Peer, rtcClient.js is used to create a PeerManager to handle the communication between WebRTC adapter and front-end application which is built with angular.js

  1-4. **Put all together and start to test**

  http(s)://<IP:PORT or YOUR_DOMAIN>/broadcast is for broadcasting real-time video streams

  http(s)://<IP:PORT or YOUR_DOMAIN>/watcher is for watching the broadcasted video streams

NOTE:

  1. BinaryJS and rtcRecorder.js are for real-time recoding. Help yourself, if you get interested.

  2. The configuration template of Nginx and the setting of binaryjs server are stored respectively in my_nginx and my_binaryjs folders

Ref.

[PPT and Description for Broadcasting](https://drive.google.com/open?id=0BzeAAvM5Ha9sclY5SzJjTGMwQkk)

[WebRTC Infrastructure](http://www.html5rocks.com/en/tutorials/webrtc/infrastructure/)

[W3C WebRTC](https://w3c.github.io/webrtc-pc/)

[Multi-User Video Conference with WebRTC](http://blog.mgechev.com/2014/12/26/multi-user-video-conference-webrtc-angularjs-yeoman/)

[WebRTC-everywhere](https://github.com/sarandogou/webrtc-everywhere)

[WebRTC adapter.js](https://github.com/sarandogou/webrtc/blob/master/samples/web/js/adapter.js)

[Temasys](https://temasys.atlassian.net/wiki/display/TWPP/How+to+integrate+the+Temasys+WebRTC+Plugin+into+your+website)

[BinaryJS](https://github.com/binaryjs/binaryjs)

[Kurento Introduction (for Java developers)](https://webrtchacks.com/kurento/)

[Kurento (for Java developers)](https://www.kurento.org/)

[DataChannel for Beginner](https://www.webrtc-experiment.com/docs/rtc-datachannel-for-beginners.html)

[MediaStreamer](https://github.com/muaz-khan/WebRTC-Experiment/blob/master/Pre-recorded-Media-Streaming/MediaStreamer.js)

[Video Processing Experiments with OpenCV and WebRTC (WebRTC could be used to do something similar to the project of Commma.ai)](https://github.com/concord-consortium/video-processing-experiments)

Issues:

[Can't create RTCIceCandidate](https://github.com/sarandogou/webrtc-everywhere/issues/43)


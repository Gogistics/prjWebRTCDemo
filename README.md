# WebRTC Tutorial

[Demo](https://youtu.be/PkFrmtpGK8w)

How WebRTC works? (by Minko Gechev)

![Sequence WebRTC by Minko Gechev](http://blog.mgechev.com/images/yeoman-angular-webrtc/sequence-webrtc.png)

Prerequisites of this tutorial:
  
  Web server, database, socket handler, WebRTC adapter, etc. In this demo, Node.js and Express.js are used to build the web server, nginx is used as the proxy server handling load balancing, standalone MongoDB is used as the database to store socket information, Redis is used to handle session information, socket.io is used to handle socket channel, official adapter.js is the WebRTC adapter, Angular.js is used to construct the front-end MVC architecture, and so on.

Technical Terms of WebRTC:

  [Network Address Translation (NAT)](https://en.wikipedia.org/wiki/Network_address_translation)

  [Session Traversal Utilities for NAT (STUN)](https://tools.ietf.org/html/rfc5389)

  [Traversal Using Relays around NAT (TURN): Relay Extensions to STUN](https://tools.ietf.org/html/rfc5766)

  [Interactive Connectivity Establishment (ICE): A Protocol for NAT Traversal for Offer/Answer Protocols](https://tools.ietf.org/html/rfc5245)


Demo 1. Broadcasting with recording mechanism (Chrome/Firefox)

  1-1. **Initiate a Node.js project:**

  See package.json as the reference of required modules

  1-2. **Back-end Development:** 

  Get streams.js and socketHandler.js ready, before creating a server.js; streams handles the stream information and conmmunication with the database which is MongoDB in our case, and socketHandler.js handles the communication  between streams.js and socket.io

  1-3. **Front-end Development:**

  Start to construct the front-end architecture built with angular.js, socket.io-client, WebRTC adapter.js, and rtcClient.js; angular.js is used to construct front-end MVC architecture, socket.io-client is used to handle the socket comminucation between front-end and back-end, adapter.js is an interface to handle RTC Peer, rtcClient.js is used to create a PeerManager to handle the communication between WebRTC adapter and front-end application which is built with angular.js

  1-4. **Put all together and start to test**

  http(s)://\<IP:PORT or YOUR_DOMAIN\>/broadcast is for broadcasting real-time video streams

  http(s)://\<IP:PORT or YOUR_DOMAIN\>/watcher is for watching the broadcasted video streams

    Flows:
    
      * General (users visit the web site)

        Browser --(1. Visit Website Broadcast/Watcher)--> Web Server --(2. Handle Socket Information)--> Socket Handler --(3. Send Notification)--> Browser

      * Broadcast

        ng-controller --(1. Configure Media Stream)--> adapter --(2. Set Local Stream)--> rtcClient --(3. Set Camera Stream)--> camera --(Notify All Scope to Update Message on Views)--> mg-controller


      * Watcher

        ng-controller --(1. Add Remote Peer)--> rtcClient --(2. Return Remote Peer)--> ng-controller

          1. Add Remote Peer

            Initiate a new Peer with peerConnectionConfig and peerConnectionConstraints. If success, send an notification to others via socket that a new ICE candidate is available

            Send **init** message to notify others via socket.io

            Remote broadcast site receives **init** notification and then send **offer** back to watcher site

            Watcher site receives **offer**, set session description, and then send **answer** back to broadcast site

            Broadcast site receives **answer** and set session description


NOTE:

  1. BinaryJS and rtcRecorder.js are for real-time recoding. Help yourself, if you get interested.

  2. The configuration template of Nginx and the setting of binaryjs server are stored respectively in my_nginx and my_binaryjs folders

Ref.

[PPT and Description for Broadcasting](https://drive.google.com/open?id=0BzeAAvM5Ha9sclY5SzJjTGMwQkk)

[WebRTC Infrastructure](http://www.html5rocks.com/en/tutorials/webrtc/infrastructure/)

[W3C WebRTC](https://w3c.github.io/webrtc-pc/)

[Symmetric NAT and It’s Problems](http://www.think-like-a-computer.com/2011/09/19/symmetric-nat/)

[Multi-User Video Conference with WebRTC](http://blog.mgechev.com/2014/12/26/multi-user-video-conference-webrtc-angularjs-yeoman/)

[WebRTC adapter.js](https://github.com/sarandogou/webrtc/blob/master/samples/web/js/adapter.js)

[WebRTC-everywhere](https://github.com/sarandogou/webrtc-everywhere)

[Temasys](https://temasys.atlassian.net/wiki/display/TWPP/How+to+integrate+the+Temasys+WebRTC+Plugin+into+your+website)

[Kurento Introduction (for Java developers)](https://webrtchacks.com/kurento/)

[Kurento (for Java developers)](https://www.kurento.org/)

[BinaryJS API](https://github.com/binaryjs/binaryjs/blob/master/doc/api.md)

[MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)

[DataChannel for Beginner](https://www.webrtc-experiment.com/docs/rtc-datachannel-for-beginners.html)

[MediaStreamer](https://github.com/muaz-khan/WebRTC-Experiment/blob/master/Pre-recorded-Media-Streaming/MediaStreamer.js)

[Video Processing Experiments with OpenCV and WebRTC (WebRTC could be used to do something similar to the project of Commma.ai)](https://github.com/concord-consortium/video-processing-experiments)

[Fingerprint](https://github.com/Valve/fingerprintjs)

Issues:

[Can't create RTCIceCandidate](https://github.com/sarandogou/webrtc-everywhere/issues/43)


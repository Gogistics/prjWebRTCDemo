'use strict';
var PeerManager = function (arg_user_type) {
  // init socket manager
  var userType = arg_user_type,
      localId,
      config = {
        peerConnectionConfig: {
          iceServers: [
            {urls: 'stun:stun1.l.google.com:19302'},
            {urls: 'stun:stun2.l.google.com:19302'},
            {urls: 'stun:stun3.l.google.com:19302'},
            {urls: 'stun:stun4.l.google.com:19302'},
            {urls: 'stun:stun.anyfirewall.com:3478'},
            {urls: "stun:stun.l.google.com:19302"},
            {urls: 'turn:turn.bistri.com:80',
              credential: 'homeo',
              username: 'homeo'},
            {urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
              credential: 'webrtc',
              username: 'webrtc'},
            {urls: 'stun:stun.services.mozilla.com'}
          ]
        },
        peerConnectionConstraints: {
          optional: [
            {"DtlsSrtpKeyAgreement": true}
          ]
        }
      },
      peerDatabase = {}, // can be replaced with real DB
      localStream,
      remoteStreamsDB = {}, // for storing remote streams and do recording if necessary
      remoteVideosContainer = document.getElementById('remoteVideosContainer'),
      socket = io(),
      externalMechanisms = {};
      
  // set socket
  socket.on('message', handleMessage);
  socket.on('id', function(id) {
    localId = id;
    console.log('<--- Local ID: ', localId ,' --->');
  });

  // auto-update mechanism
  socket.on('streamNotification', function(res){
    console.log('<--- stream notification --->');
    console.log(res);
    if(externalMechanisms.hasOwnProperty('load_data')){
      // if remote tream off, remove stream
      if(res.notification_key === 'stream_off'){
        var remote_id = res.client_id_from,
            peer = peerDatabase[remote_id];

        // remove child element; not necessary for broadcast
        try{
          if( remoteVideosContainer &&
              remoteVideosContainer.hasChildNodes() &&
              remoteVideosContainer.contains(peer.remoteVideosDiv)){
              remoteVideosContainer.removeChild(peer.remoteVideosDiv);
          }
        }catch(err){
          console.log(err);
        }
      }
      // load data
      externalMechanisms.load_data();
      console.log('streamNotification: update stream list...');
    }
  });

  // for broadcast to update watcher list
  socket.on('watcherNotification', function(res){
    console.log('<--- watcher notification --->');
    console.log(res);
    if(externalMechanisms.hasOwnProperty('load_watchers')){
      console.log('watcherNotification: update watcher list...');
      externalMechanisms.load_watchers();
    }
  });
  // end of auto-update mechanism

  // add peer
  function addPeer(remoteId, arg_usertype) {
    var peer = new Peer(config.peerConnectionConfig, config.peerConnectionConstraints, remoteId, arg_usertype);
    peer.pc.onicecandidate = function(event) {
      if (event.candidate) {
        send('candidate', remoteId, {
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        });
      }
    };
    peer.pc.onaddstream = function(event) {
      // recording mechanism could be assigned here
      attachMediaStream(peer.remoteVideoEl, event.stream);
      remoteVideosContainer.appendChild(peer.remoteVideosDiv);
      remoteStreamsDB[peer.remoteVideoEl.id] = event.stream;
    };
    peer.pc.onremovestream = function(event) {
      // remove child element
      try{
        if( remoteVideosContainer.hasChildNodes() &&
          remoteVideosContainer.contains(peer.remoteVideosDiv)){
          remoteVideosContainer.removeChild(peer.remoteVideosDiv);
        }
        // remove remote stream (incomplete)
      }catch(err){
        console.log(err);
      }
    };
    peer.pc.oniceconnectionstatechange = function(event) {
      switch(
      (  event.srcElement // Chrome
      || event.target   ) // Firefox
      .iceConnectionState) {
        case 'disconnected':
          // remove child element
          try{
            if( remoteVideosContainer &&
                remoteVideosContainer.hasChildNodes() &&
                remoteVideosContainer.contains(peer.remoteVideosDiv)){
                remoteVideosContainer.removeChild(peer.remoteVideosDiv);
            }
          }catch(err){
            console.log(err);
          }
          break;
      }
    };
    // removeStream() to support Firefox
    peer.pc.removeStream = function() {
      peer.pc.getSenders().forEach(function(sender){
        console.log('<---sender at removeStream--->');
        console.log(sender);
        // incomplete; this mechanism will be triggered twice to remove video & audio tracks
        try{
          peer.pc.removeTrack(sender);

          // for removing video element in container (not necessary for broadcast)
          if( remoteVideosContainer &&
              remoteVideosContainer.hasChildNodes() &&
              remoteVideosContainer.contains(peer.remoteVideosDiv) ){
              remoteVideosContainer.removeChild(peer.remoteVideosDiv);
          }
        }catch(err){
          console.log(err);
        }
      });
    };
    // end removeStream

    peerDatabase[remoteId] = peer;
    return peer;
  }
  // end of addPeer

  // answer
  function answer(remoteId) {
    var pc = peerDatabase[remoteId].pc;

    pc.createAnswer(
      function(sessionDescription) {
        pc.setLocalDescription(sessionDescription);
        send('answer', remoteId, sessionDescription);
      }, 
      error, setSdpConstraints());
  }
  // end of answer

  // offer
  function offer(remoteId) {
    var pc = peerDatabase[remoteId].pc;
    pc.createOffer(
      function(sessionDescription) {
        pc.setLocalDescription(sessionDescription);
        send('offer', remoteId, sessionDescription);
      }, 
      error, setSdpConstraints());
  }
  // end of offer

  function addWatcher(remoteId){
    console.log('<--- addWatcher broadcast info. --->');
    console.log(remoteId);
    socket.emit('addWatcher', {
      localId: localId,
      remoteId: remoteId,
      userType: userType
    });
  }
  
  // remove stream ID from broadcast doc.
  function removeWatcherIdFromDB(remoteId){
    console.log('<--- remove watcher from broadcast doc. --->');
    console.log(remoteId);
    socket.emit('removeWatcher', {
      localId: localId,
      remoteId: remoteId,
      userType: userType
    });
  }

  // set SDP constraints
  function setSdpConstraints() {
    return !!navigator.mozGetUserMedia ?
    {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
    } :
    {
        optional: [],
        mandatory: {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true
        }
    };
  }

  // handleMessage
  function handleMessage(message) {
    var type = message.type,
        from = message.from,
        pc = (peerDatabase[from] || addPeer(from, userType)).pc;

    console.log('<---handleMessage--->');
    console.log('received ' + type + ' from ' + from);
    console.log(message);
    console.log('<---end of handleMessage--->');
    switch (type) {
      case 'init':
        toggleLocalStream(pc);
        offer(from);
        addWatcher(from);
        break;
      case 'remove':
        removeStream(pc);
        removeWatcherIdFromDB(from);
        offer(from);
        break;
      case 'offer':
        if (!!message.payload) pc.setRemoteDescription(new RTCSessionDescription(message.payload)).then(function(){ console.log('successfully receive offer'); }).catch(error);
        answer(from);
        break;
      case 'answer':
        if (!!message.payload) pc.setRemoteDescription(new RTCSessionDescription(message.payload)).then(function(){ console.log('successfully receive offer'); }).catch(error);
        break;
      case 'candidate':
        if(pc.remoteDescription) {
          pc.addIceCandidate(new RTCIceCandidate({
            sdpMLineIndex: message.payload.label,
            sdpMid: message.payload.id,
            candidate: message.payload.candidate
          })).then(function(){}).catch(error);
        }
        /*
        if( !pc.remoteDescription && !!message.payload ){
          console.log('<--candidate-->');
          console.log(pc);
          console.log(message);
          pc.setRemoteDescription(new RTCSessionDescription(message.payload)).then(function(){ console.log('successfully set remote description for candidate'); }).catch(error);

          pc.addIceCandidate(new RTCIceCandidate({
            sdpMLineIndex: message.payload.label,
            sdpMid: message.payload.id,
            candidate: message.payload.candidate})).then(function(){ console.log('successfully add icecandidate'); }).catch(error);
        } */
        break;
    }
  }
  // end of handleMessage

  // send
  function send(type, to, payload) {
    console.log('<---send--->');
    console.log('sending ' + type + ' to ' + to);
    console.log(payload);
    console.log('<---end of send--->');
    socket.emit('message', {
      to: to,
      type: type,
      payload: payload
    });
  }
  // end of send

  // toogleLocalStream
  function toggleLocalStream(pc) {
    console.log('<---toggleLocalStream--->');
    console.log(pc.getLocalStreams);
    if(localStream) {
      (!!pc.getLocalStreams().length) ? pc.removeStream() : pc.addStream(localStream);
    }
  }

  // remove stream
  function removeStream(pc) {
    console.log('<---removeStream--->');
    if (localStream && !!pc.getLocalStreams().length) {
      console.log(pc.getLocalStreams());
      pc.removeStream();
    }
  }

  // error logger
  function error(err){
    console.log(err);
  }
  // end of error

  return {
    getId: function() {
      return localId;
    },
    setLocalStream: function(stream) {
      if(!stream) {
        for(var id in peerDatabase) {
          var pc = peerDatabase[id].pc;
          if(!!pc.getLocalStreams().length) {
            pc.removeStream(localStream);
            offer(id);
          }
        }
      }
      localStream = stream;
    }, 
    toggleLocalStream: function(remoteId) {
      var peer = peerDatabase[remoteId] || addPeer(remoteId, userType);
      toggleLocalStream(peer.pc);
    },
    peerInit: function(remoteId) {
      var peer = peerDatabase[remoteId] || addPeer(remoteId, userType);
      send('init', remoteId, null);
      return peer;
    },
    peerRenegociate: function(remoteId) {
      offer(remoteId);
    },
    send: function(type, payload) {
      socket.emit(type, payload);
    },
    removeStream: function(remoteId){
      var peer = peerDatabase[remoteId];
      // peer.pc.close();
      send('remove', remoteId, null); // should be removeStream(peer.pc) and send an notification to remote offer
    },
    // load_data mechanism (temp)
    addExternalMechanism: function(arg_mechanism_name, arg_mechanism){
      // set external mechanism
      externalMechanisms[arg_mechanism_name] = arg_mechanism;
    },
    // to start and stop recording for remote streams
    getRemoteStreamsDB: function(){
      return remoteStreamsDB;
    }
  };
};

/*
* Peer (remote)
* RTCPeer connection is built up here and the remote video tag is created here as well
* Therefore, the recording mechanism can be developed here
*/
var Peer = function (pcConfig, pcConstraints, arg_remote_id, arg_usertype){
  this.pc = new RTCPeerConnection(pcConfig, pcConstraints);
  this.remoteVideoEl = document.createElement('video');
  this.remoteVideoEl.controls = true;
  this.remoteVideoEl.autoplay = true;
  this.remoteVideoEl.muted = true; // tmp init
  this.remoteVideoEl.id = arg_remote_id; // to set the remote id for future use

  // create remote video div
  this.remoteVideosDiv = document.createElement('div');
  this.remoteVideosDiv.className = 'remoteVideosDiv';
  this.remoteVideosDiv.id = arg_remote_id; // to set the remote id for future use
  this.remoteVideosDiv.appendChild(document.createElement('hr'));
  this.remoteVideosDiv.appendChild(this.remoteVideoEl);
  this.remoteVideosDiv.appendChild(document.createElement('br'));
  
  if(arg_usertype === 'broadcast'){
    // set btns for rtcRecorder
    this.startRecordingBtn = document.createElement('input'),
    this.stopRecordingBtn = document.createElement('input');

    this.startRecordingBtn.setAttribute('type', 'button');
    this.stopRecordingBtn.setAttribute('type', 'button');

    this.startRecordingBtn.className = 'col-sm-6 col-xs-12 btn btn-default';
    this.stopRecordingBtn.className = 'col-sm-6 col-xs-12 btn btn-default';

    this.startRecordingBtn.setAttribute('value', 'Start Recording');
    this.stopRecordingBtn.setAttribute('value', 'Stop Recording');

    this.stopRecordingBtn.setAttribute('disabled', true);
    this.remoteVideosDiv.appendChild(this.startRecordingBtn);
    this.remoteVideosDiv.appendChild(this.stopRecordingBtn);
  }
}

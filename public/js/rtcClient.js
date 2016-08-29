var PeerManager = (function () {
  // init socket manager
  var local_id,
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
      remoteVideoContainer = document.getElementById('remoteVideosContainer'),
      socket = io(),
      externalMechanisms = {};
      
  // set socket
  socket.on('message', handleMessage);
  socket.on('id', function(id) {
    local_id = id;
  });

  // auto-update mechanism (beta)
  socket.on('streamNotification', function(res){
    console.log(res);
    if(externalMechanisms.hasOwnProperty('load_data')){
      // if remote tream off, remove stream
      if(res.notification_key === 'stream_off'){
        var remote_id = res.client_id_from,
            peer = peerDatabase[remote_id];
        // remove child element
        try{
          if( remoteVideosContainer.hasChildNodes() &&
              remoteVideosContainer.contains(peer.remoteVideoDiv)){
              remoteVideosContainer.removeChild(peer.remoteVideoDiv);
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
  // end of auto-update mechanism

  // funstions
  function addPeer(remoteId) {
    var peer = new Peer(config.peerConnectionConfig, config.peerConnectionConstraints, remoteId);
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
      remoteVideosContainer.appendChild(peer.remoteVideoDiv);
      remoteStreamsDB[peer.remoteVideoEl.id] = event.stream;
    };
    peer.pc.onremovestream = function(event) {
      // remove child element
      try{
        if( remoteVideosContainer.hasChildNodes() &&
          remoteVideosContainer.contains(peer.remoteVideoDiv)){
          remoteVideosContainer.removeChild(peer.remoteVideoDiv);
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
            if( remoteVideosContainer.hasChildNodes() &&
                remoteVideosContainer.contains(peer.remoteVideoDiv)){
                remoteVideosContainer.removeChild(peer.remoteVideoDiv);
            }

            // remove remote stream (incomplete)
          }catch(err){
            console.log(err);
          }
          break;
      }
    };
    // removeStream() to support Firefox
    peer.pc.removeStream = function(stream) {
      peer.pc.getSenders().forEach(function(sender){
        console.log(sender);
        // incomplete; this mechanism will be triggered twice to remove video & audio tracks
        try{
          peer.pc.removeTrack(sender);
          if( remoteVideosContainer.hasChildNodes() &&
              remoteVideosContainer.contains(peer.remoteVideoDiv)){
              remoteVideosContainer.removeChild(peer.remoteVideoDiv);
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
        pc = (peerDatabase[from] || addPeer(from)).pc;

    console.log('received ' + type + ' from ' + from);
    switch (type) {
      case 'init':
        toggleLocalStream(pc);
        offer(from);
        break;
      case 'offer':
        console.log(message);
        if (!!message.payload) pc.setRemoteDescription(new RTCSessionDescription(message.payload)).then(function(){ console.log('successfully receive offer'); }).catch(error);
        answer(from);
        break;
      case 'answer':
        if (!!message.payload) pc.setRemoteDescription(new RTCSessionDescription(message.payload)).then(function(){ console.log('successfully receive offer'); }).catch(error);
        break;
      case 'candidate':
        /* if(pc.remoteDescription) {
          console.log(message.payload);

          pc.addIceCandidate(new RTCIceCandidate({
            sdpMLineIndex: message.payload.label,
            sdpMid: message.payload.id,
            candidate: message.payload.candidate
          })).then(function(){}).catch(error); */

        if( pc.remoteDescription || (!pc.remoteDescription && !!message.payload) ){
          console.log('<--candidate-->');
          console.log(pc);
          console.log(message);
          pc.setRemoteDescription(new RTCSessionDescription(message.payload)).then(function(){ console.log('successfully set remote description for candidate'); }).catch(error);

          pc.addIceCandidate(new RTCIceCandidate({
            sdpMLineIndex: message.payload.label,
            sdpMid: message.payload.id,
            candidate: message.payload.candidate})).then(function(){ console.log('successfully add icecandidate'); }).catch(error);
        }

        break;
    }
  }
  // end of handleMessage

  // send
  function send(type, to, payload) {
    console.log('sending ' + type + ' to ' + to);
    console.log(payload);
    socket.emit('message', {
      to: to,
      type: type,
      payload: payload
    });
  }
  // end of send

  // toogleLocalStream
  function toggleLocalStream(pc) {
    if(localStream) {
      (!!pc.getLocalStreams().length) ? pc.removeStream(localStream) : pc.addStream(localStream);
    }
  }
  // end of toogleLocalStream

  // error logger
  function error(err){
    console.log(err);
  }
  // end of error

  return {
    getId: function() {
      return local_id;
    },
    setLocalStream: function(stream) {
      // if local cam has been stopped, remove it from all outgoing streams.
      if(!stream) {
        for(id in peerDatabase) {
          pc = peerDatabase[id].pc;
          if(!!pc.getLocalStreams().length) {
            pc.removeStream(localStream);
            offer(id);
          }
        }
      }
      localStream = stream;
    }, 
    toggleLocalStream: function(remoteId) {
      peer = peerDatabase[remoteId] || addPeer(remoteId);
      toggleLocalStream(peer.pc);
    },
    peerInit: function(remoteId) {
      peer = peerDatabase[remoteId] || addPeer(remoteId);
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
      peer = peerDatabase[remoteId];
      send('init', remoteId, null);
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
});

/*
* Peer (remote)
* RTCPeer connection is built up here and the remote video tag is created here as well
* Therefore, the recording mechanism can be developed here
*/
var Peer = function (pcConfig, pcConstraints, arg_remote_id){
  this.pc = new RTCPeerConnection(pcConfig, pcConstraints);
  this.remoteVideoEl = document.createElement('video');
  this.remoteVideoEl.controls = true;
  this.remoteVideoEl.autoplay = true;
  this.remoteVideoEl.muted = true; // tmp init
  this.remoteVideoEl.id = arg_remote_id; // to set the remote id for future use

  //
  this.startRecordingBtn = document.createElement('input'),
  this.stopRecordingBtn = document.createElement('input');

  this.startRecordingBtn.setAttribute('type', 'button');
  this.stopRecordingBtn.setAttribute('type', 'button');

  this.startRecordingBtn.className = 'col-sm-6 col-xs-12 btn btn-default';
  this.stopRecordingBtn.className = 'col-sm-6 col-xs-12 btn btn-default';

  this.startRecordingBtn.setAttribute('value', 'Start Recording');
  this.stopRecordingBtn.setAttribute('value', 'Stop Recording');

  this.stopRecordingBtn.setAttribute('disabled', true);

  // create remote video div
  this.remoteVideoDiv = document.createElement('div');
  this.remoteVideoDiv.className = 'remoteVideosDiv';
  this.remoteVideoDiv.id = arg_remote_id; // to set the remote id for future use
  this.remoteVideoDiv.appendChild(document.createElement('hr'));
  this.remoteVideoDiv.appendChild(this.remoteVideoEl);
  this.remoteVideoDiv.appendChild(document.createElement('br'));
  this.remoteVideoDiv.appendChild(this.startRecordingBtn);
  this.remoteVideoDiv.appendChild(this.stopRecordingBtn);
}

/* bootstrap front-end MVC architecture with Angular.js */
(function($){
  angular.element(document).ready(function(){
  	// bootstrap App
    angular.bootstrap(document.body, ['watcherApp']);
  });

  // init App
  initApp();

  function initApp(){
    // set module
    window.watcherApp = window.watcherApp || angular.module('watcherApp', [], function($locationProvider, $interpolateProvider){
      $locationProvider.html5Mode(true);
      $interpolateProvider.startSymbol('[[');
      $interpolateProvider.endSymbol(']]');
    });

    // global values
    window.watcherApp.value('APP_VALUES', {
      EMAIL: 'gogistics@gogistics-tw.com'
    });

    window.watcherApp.config(function(){
      // routing config
    });

    window.watcherApp.run(function(){
      // set up connection with binaryjs-server
      window.binaryClient = window.binaryClient || new BinaryClient('ws://45.79.106.150:8888');
      window.binaryClient.on('open', function(stream) {
        console.log(stream);
        // for the sake of this example let's put the stream in the window
        window.myBinaryStream = window.binaryClient.createStream({from: 'watcher'});

        // receive data
        window.myBinaryStream.on('data', function(data){
          console.log(data);
        });
      });
    });

    window.watcherApp.service('dataProvider', function($http, APP_VALUES){
      this.getStreams = function(arg_url, arg_headers, arg_data){
        return $http({
           url: arg_url,
           method: 'POST',
           data: arg_data,
           headers: arg_headers
      	});
      }
    });

    window.watcherApp.factory('client', function(){
      return new PeerManager();
    });

    window.watcherApp.controller('watcherCtrl', ['$scope', '$window', 'dataProvider', 'client', function($scope, $window, dataProvider, client){
      var ctrl = this;
      ctrl.broadcastStreams = [];
      ctrl.remoteStreamsDB = client.getRemoteStreamsDB();
      ctrl.name = 'watcher';

      ctrl.getStreamById = function(arg_id){
        // will be replaced by binary-sort
        for(var jth = 0, max = ctrl.broadcastStreams.length; jth < max; jth++){
          if(ctrl.broadcastStreams[jth]['id'] === arg_id) return ctrl.broadcastStreams[jth];
        }
      }

      ctrl.loadData = function(){
        // load latest streams
        var customHeaders = { 'current_cookie': $window.document.cookie,
                              'Content-Type': 'application/json'};
        dataProvider.getStreams('/streams', customHeaders, {user_type: 'broadcast'})
                    .success(function(data, status, headers, config){
                      console.log(data);
                      var latestStreams = data.broadcastStreams;
                      for(var ith = 0, max = latestStreams.length; ith < max; ith++){
                        var stream = ctrl.getStreamById(latestStreams[ith]['id']);
                        latestStreams[ith].isPlaying = (!!stream) ? stream.isPlaying : false;
                      }
                      ctrl.broadcastStreams = latestStreams;
                    }).error(function(data, status, headers, config){
                      console.log(data);
                    });
      }
      client.addExternalMechanism('load_data', ctrl.loadData);

      ctrl.view = function(arg_stream){
        if(!arg_stream.isPlaying){
        var remotePeer = client.peerInit(arg_stream['id']);
        // client.peerRenegociate(arg_stream['id']);
        remotePeer.startRecordingBtn.addEventListener('click', function(){
          ctrl.startTimestamp = new Date().getTime();
          ctrl.rtcRecorder = RecordRTC(ctrl.remoteStreamsDB[remotePeer.remoteVideoEl.id], {bufferSize: 16384, type: 'video', frameInterval: 20});
          ctrl.rtcRecorder.startRecording();
          remotePeer.stopRecordingBtn.disabled = false;
          remotePeer.startRecordingBtn.disabled = true;
        });

        remotePeer.stopRecordingBtn.addEventListener('click', function(){
          remotePeer.startRecordingBtn.disabled = false;
          remotePeer.stopRecordingBtn.disabled = true;

          ctrl.stopTimestamp = new Date().getTime();
          var fileName = ctrl.name + '-' + ctrl.startTimestamp + '_' + ctrl.stopTimestamp;
          ctrl.rtcRecorder.stopRecording();
          ctrl.rtcRecorder.save(fileName);
        });
        arg_stream.isPlaying = !arg_stream.isPlaying;
        }else{
          console.log('remove remote stream...');
          client.removeStream(arg_stream['id']);
          arg_stream.isPlaying = !arg_stream.isPlaying;
        }
      };
      ctrl.loadData();
    }]);
  }
})(jQuery);

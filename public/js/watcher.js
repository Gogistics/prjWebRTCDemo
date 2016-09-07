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
      $locationProvider.html5Mode(true); // set html5 mode

      // change interploate to avoid conflicts when template engines use {{...}}
      $interpolateProvider.startSymbol('[[');
      $interpolateProvider.endSymbol(']]');
    });

    // global values
    window.watcherApp.value('APP_VALUES', {
      EMAIL: 'gogistics@gogistics-tw.com',
      BINARY_STREAM: null
    });

    window.watcherApp.config(function(){
      // routing config is usually done here
    });

    window.watcherApp.run(function(){
      // run
    });

    // services of serving $http
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

    // PeerManager factory as client of handling peer information (PeerManager is from rtcClient.js)
    window.watcherApp.factory('client', function(){
      return new PeerManager();
    });

    window.watcherApp.factory('binaryjsClient', function(){
      return new BinaryClient('ws://45.79.106.150:8888');
    });

    // watcher controller which handle everything inside watcher scope
    window.watcherApp.controller('watcherCtrl', ['$scope', '$window', 'dataProvider', 'client', 'binaryjsClient', function($scope, $window, dataProvider, client, binaryjsClient){
      var ctrl = this;
      ctrl.broadcastStreams = [];
      ctrl.remoteStreamsDB = client.getRemoteStreamsDB();
      ctrl.name = 'watcher' + client.getId();

      ctrl.getStreamById = function(arg_id){
        // use binary sort to search stream by id since the return is sorted from MongoDB
        var minIndex = 0,
            maxIndex = ctrl.broadcastStreams.length - 1,
            currentIndex,
            currentElem;

        while(minIndex <= maxIndex){
          currentIndex = (minIndex + maxIndex) / 2 | 0;
          currentElem = ctrl.broadcastStreams[currentIndex];

          if(currentElem['id'] < arg_id){
            minIndex = currentIndex + 1;
          }else if(currentElem['id'] > arg_id){
            maxIndex = currentIndex - 1;
          }else{
            return ctrl.broadcastStreams[currentIndex];
          }
          return null; // no match
        }
      }

      ctrl.loadData = function(){
        // load latest streams
        var customHeaders = { 'current_cookie': $window.document.cookie,
                              'Content-Type': 'application/json'};
        dataProvider.getStreams('/streams', customHeaders, {user_type: 'broadcast'})
                    .success(function(data, status, headers, config){
                      console.log('<---getStreams--->');
                      console.log(data);
                      var latestStreams = data.broadcastStreams;
                      for(var ith = 0, max = latestStreams.length; ith < max; ith++){
                        var stream = ctrl.getStreamById(latestStreams[ith]['id']);
                        latestStreams[ith].isPlaying = (!!stream) ? stream.isPlaying : false;
                      }
                      ctrl.broadcastStreams = latestStreams;
                    }).error(function(data, status, headers, config){
                      console.log('<---error of getStreams--->');
                      console.log(data);
                    });
      }
      client.addExternalMechanism('load_data', ctrl.loadData);

      ctrl.view = function(arg_stream){
        if(!arg_stream.isPlaying){
        var remotePeer = client.peerInit(arg_stream['id']);

        // set event listener of starting recording
        remotePeer.startRecordingBtn.addEventListener('click', function(){
          remotePeer.stopRecordingBtn.disabled = false; // switch stop btn status
          remotePeer.startRecordingBtn.disabled = true; // switch start btn status

          // setting of binaryjsStream and rtcRecorder
          binaryjsClient.on('open', function(stream) {
            console.log(stream);
            // for the sake of this example let's put the stream in the window
            var from = 'watcher-' + client.getId();
            APP_VALUES.BINARY_STREAM = binaryjsClient.createStream({from: from});

            // receive data
            APP_VALUES.BINARY_STREAM.on('data', function(data){
              console.log(data);
            });
          });
          ctrl.startTimestamp = new Date().getTime();
          ctrl.rtcRecorder = RecordRTC( ctrl.remoteStreamsDB[remotePeer.remoteVideoEl.id],
                                        {bufferSize: 16384, type: 'video', frameInterval: 20}, function(arg_data){
                                          var arrayBuffer, uint16Array;
                                          var fileReader = new FileReader();
                                          fileReader.onload = function() {
                                              arrayBuffer = this.result;
                                              uint16Array = new Uint16Array(arrayBuffer, 0, (arrayBuffer.length - 1));
                                              if( !!APP_VALUES.BINARY_STREAM && !!uint16Array){
                                                  APP_VALUES.BINARY_STREAM.write(uint16Array);
                                                  console.log(uint16Array);
                                              }else{
                                                  console.log(arrayBuffer);
                                              }
                                          };
                                          fileReader.readAsArrayBuffer(arg_data);
                                        });
          ctrl.rtcRecorder.startRecording();
        });

        // set event listener of stopping recording
        remotePeer.stopRecordingBtn.addEventListener('click', function(){
          remotePeer.startRecordingBtn.disabled = false; // switch stop btn status
          remotePeer.stopRecordingBtn.disabled = true; // switch start btn status
          APP_VALUES.BINARY_STREAM.end();

          ctrl.stopTimestamp = new Date().getTime();
          var fileName = ctrl.name + '-' + ctrl.startTimestamp + '_' + ctrl.stopTimestamp; // set temporary file name
          ctrl.rtcRecorder.stopRecording();
          ctrl.rtcRecorder.save(fileName); // optional
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

/* bootstrap front-end MVC architecture with Angular.js */
(function($){
  angular.element(document).ready(function(){
    // bootstrap App
    angular.bootstrap(document.body, ['broadcastApp']);
  });

  // init App
  initApp();

  function initApp(){
    // set module
    window.broadcastApp = window.broadcastApp || angular.module('broadcastApp', [], function($locationProvider, $interpolateProvider){
      $locationProvider.html5Mode(true); // set html5 mode

      // change interploate to avoid conflicts when template engines use {{...}}
      $interpolateProvider.startSymbol('[[');
      $interpolateProvider.endSymbol(']]');
    });

    // global values
    window.broadcastApp.value('APP_VALUES', {
      EMAIL: 'gogistics@gogistics-tw.com',
      MEDIA_CONFIG: {audio: true,
                     video: true},
      BINARY_STREAM: null
    });

    window.broadcastApp.config(function(){
      // routing config
    });

    window.broadcastApp.run(function(){
      // run
    });

    window.broadcastApp.service('dataProvider', function($http, APP_VALUES){
      this.getStreams = function(arg_url, arg_headers, arg_data){
        return $http({
           url: arg_url,
           method: 'POST',
           data: arg_data,
           headers: arg_headers
        });
      }
    });

    window.broadcastApp.factory('client', function(){
      return new PeerManager();
    });

    window.broadcastApp.factory('binaryjsClient', function(APP_VALUES){
      return new BinaryClient('ws://45.79.106.150:8888');
    });

    window.broadcastApp.factory('camera', ['$window', '$rootScope', 'client', 'APP_VALUES', function($window, $rootScope, client, APP_VALUES){
      var camera = {};
      camera.preview = $window.document.getElementById('localVideo');
      camera.isOn = false;
      camera.start = function(){
        return requestUserMedia(APP_VALUES.MEDIA_CONFIG)
              .then(function(stream){
                // onSuccess
                attachMediaStream(camera.preview, stream);
                client.setLocalStream(stream);
                camera.stream = stream;
                camera.isOn = true;
                $rootScope.$broadcast('cameraIsOn',true);
                console.log('OnSuccess...');
              }, function(err){
                console.log('OnError...');
              }).catch(Error('Failed to get access to local media'));
      }
      camera.stop = function(){
        return new Promise(function(resolve, reject){
          try{
            // MediaStream.stop() is deprecated and will soon be removed. Use MediaStreamTrack.stop() instead.
            camera.stream.stop();
            camera.preview.src = '';
            resolve();
          }catch(err){
            reject(err);
          }
        }).then(function(result){
          camera.isOn = false;
          $rootScope.$broadcast('cameraIsOn',false);
        });
      };
      return camera;
    }]);

    window.broadcastApp.controller('broadcastCtrl', ['$scope', '$window', 'APP_VALUES', 'dataProvider', 'client', 'binaryjsClient', 'camera', function($scope, $window, APP_VALUES, dataProvider, client, binaryjsClient, camera){
      var ctrl = this;
      ctrl.name = 'WebRTC Broadcast-' + client.getId();
      ctrl.link = '';
      ctrl.cameraIsOn = false;
      ctrl.userType = null;

      $scope.$on('cameraIsOn', function(event, data){
        console.log(data);
        $scope.$apply(function(){
          ctrl.cameraIsOn = data;
        });
      });

      ctrl.init = function(arg_user_type){
        ctrl.userType = arg_user_type;
      }

      ctrl.toggleCam = function(){
        if(ctrl.cameraIsOn){
          // stop recording if it's on
          ctrl.stopRecording();

          // stop camera
          camera.stop().then(function(result){
            client.send('leave', {name: ctrl['name'], user_type: 'broadcast'});
            client.setLocalStream(null);
            $window.location.reload();
          }).catch(function(err){
            console.log(err);
          });
        } else {
          console.log('start camera...');
          camera.start().then(function(result){
            ctrl.link = $window.location.host + '/' + client.getId();
            client.send('readyToStream', {name: ctrl['name'], user_type: ctrl['userType']});

            // open binaryjsStream
            binaryjsClient.on('open', function(stream) {
              console.log(stream);
            });
          });
        }
      }


      ctrl.isRecording = false;
      ctrl.startRecording = function(){
        if(!ctrl.isRecording){
          ctrl.isRecording = !ctrl.isRecording;

            // for the sake of this example let's put the stream in the window
            var from = 'broadcast-' + client.getId();
            APP_VALUES.BINARY_STREAM = binaryjsClient.createStream({from: from});

            // receive data
            APP_VALUES.BINARY_STREAM.on('data', function(data){
              console.log(data);
            });


          // rtcRecorder
          ctrl.startTimestamp = new Date().getTime();
          ctrl.rtcRecorder = RecordRTC( camera.stream,
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
        }
      }

      ctrl.stopRecording = function(){
        if(ctrl.isRecording){
          ctrl.isRecording = !ctrl.isRecording; // switch btn status
          APP_VALUES.BINARY_STREAM.end(); // end writing stream

          ctrl.stopTimestamp = new Date().getTime();
          var fileName = ctrl.name + '-' + ctrl.startTimestamp + '_' + ctrl.stopTimestamp; // set temporary file name
          ctrl.rtcRecorder.stopRecording();
          ctrl.rtcRecorder.save(fileName); // optional
        };
      }
    }]);
  }
})(jQuery);

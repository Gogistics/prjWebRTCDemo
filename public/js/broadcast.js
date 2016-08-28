/**/
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
      $locationProvider.html5Mode(true);
      $interpolateProvider.startSymbol('[[');
      $interpolateProvider.endSymbol(']]');
    });

    // global values
    window.broadcastApp.value('APP_VALUES', {
      EMAIL: 'gogistics@gogistics-tw.com',
      MEDIA_CONFIG: {audio: true,
                     video: {optional: [{sourceId: "X978DoubangoTelecomScreenCapturer785"}]}},
      LOCAL_STREAM: null
    });

    window.broadcastApp.config(function(){
      // routing config
    });

    window.broadcastApp.run(function(){
      // set up connection with binaryjs-server
      window.binaryClient = window.binaryClient || new BinaryClient('ws://45.79.106.150:8888');
      window.binaryClient.on('open', function(stream) {
        console.log(stream);
        // for the sake of this example let's put the stream in the window
        window.myBinaryStream = window.binaryClient.createStream({from: 'broadcast'});

        // receive data
        window.myBinaryStream.on('data', function(data){
          console.log(data);
        });
      });
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

    window.broadcastApp.factory('camera', ['$window', '$rootScope', 'client', 'APP_VALUES', function($window, $rootScope, client, APP_VALUES){
      var camera = {};
      camera.preview = $window.document.getElementById('localVideo');
      camera.isOn = false;
      camera.start = function(){
        return requestUserMedia(APP_VALUES.MEDIA_CONFIG)
              .then(function(stream){
                // onSuccess
                APP_VALUES.LOCAL_STREAM = stream; // for recording
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

    window.broadcastApp.controller('broadcastCtrl', ['$scope', '$window', 'dataProvider', 'client', 'camera', function($scope, $window, dataProvider, client, camera){
      var ctrl = this;
      ctrl.name = 'WebRTC Broadcast';
      ctrl.link = '';
      ctrl.cameraIsOn = false;
      ctrl.isFirefox = !!navigator.mozGetUserMedia;
      ctrl.isStartRecordingBtnDisabled = false;
      ctrl.isStopRecordingBtnDisabled = true;
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
          });
        }
      }

      ctrl.startRecording = function(){
        // to be continued
      }

      ctrl.stopRecording = function(){
        // to be continued
      }

    }]);
  }
})(jQuery);

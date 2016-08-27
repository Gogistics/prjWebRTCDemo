/**/
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
              video: { mandatory: {
                    minWidth: 1280,
                    minHeight: 720,
                    maxWidth: 1280,
                    maxHeight: 720,
                    frameRate: { min: 35, ideal: 50, max: 60 }
                  }
              }
          },
      LOCAL_STREAM: null
    });

    window.broadcastApp.config(function(){
      //
    });

    window.broadcastApp.run(function(){
      //
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

    window.broadcastApp.factory('camera', ['$window', 'client', 'APP_VALUES', function($window, client, APP_VALUES){
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

    window.broadcastApp.controller('broadcastCtrl', ['$scope', 'dataProvider', 'client', 'camera', function($scope, dataProvider, client, camera){
      var ctrl = this;
      alert('Broadcast Ctrl');
    }]);
  }
})(jQuery);

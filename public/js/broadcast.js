/**/
/**/
(function($){
  angular.element(document.body).ready(function(){
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
          }
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

    window.broadcastApp.controller('broadcastCtrl', ['$scope', 'dataProvider', 'client', function($scope, dataProvider, client){
      var ctrl = this;
      alert('Broadcast Ctrl');
    }]);
  }
})(jQuery);
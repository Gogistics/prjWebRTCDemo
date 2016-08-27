/**/
/**/
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

    window.watcherApp.config(function(){
      //
    });

    window.watcherApp.run(function(){
      //
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

    window.watcherApp.controller('watcherCtrl', ['$scope', 'dataProvider', 'client', function($scope, dataProvider, client){
      var ctrl = this;
      alert('Watcher Ctrl');
    }]);
  }
})(jQuery);

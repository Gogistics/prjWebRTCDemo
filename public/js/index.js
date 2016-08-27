/**/
(function($){
  angular.element(document.body).ready(initApp);

  function initApp(){
    // bootstrap
    angular.bootstrap(document.body, ['indexApp']);

    // set module
    window.indexApp = window.indexApp || angular.module('indexApp', [], function($locationProvider, $interpolateProvider){
      $locationProvider.html5Mode(true);
      $interpolateProvider.startSymbol('[[');
      $interpolateProvider.endSymbol(']]');
    });

    // global values
    window.indexApp.value('APP_VALUES', {
      EMAIL: 'gogistics@gogistics-tw.com'
    });

    window.indexApp.config(function(){
      //
    });

    window.indexApp.run(function(){
      //
    });

    window.indexApp.service('dataProvider', function($http, APP_VALUES){
      this.getStreams = function(arg_url, arg_headers, arg_data){
        //
      }
    });

    window.indexApp.controller('indexCtrl', ['$scope', '$dataProvider', function($scope, dataProvider){
      var ctrl = this;
      alert('Index Ctrl');
    }]);
  }
})(jQuery);
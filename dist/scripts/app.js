var tableReader = angular.module('TableReader', ['ui.router', 'firebase']);

tableReader.run(['$rootScope', '$state', function($rootScope, $state) {
  $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
    if (error === 'AUTH_REQUIRED') {
      $state.go('login');
    }
  });
}]);

tableReader.factory('Auth', ['$firebaseAuth', 'FIREBASE_URL', function ($firebaseAuth, FIREBASE_URL) {
  
  var ref = new Firebase(FIREBASE_URL);
  return $firebaseAuth(ref);
}]);

tableReader.config(['$stateProvider', '$locationProvider', function ($stateProvider, $locationProvider) {
  $locationProvider.html5Mode(true);

  $stateProvider.state('login', {
    url: '/',
    controller: 'Login.controller',
    templateUrl: '/templates/login.html',
    resolve: {
      "currentAuth": ['Auth', function (Auth) {
        return Auth.$waitForAuth();
      }]
    }
  });

  $stateProvider.state('home', {
    url: '/home',
    controller: 'Home.controller',
    templateUrl: '/templates/home.html'
  });

  $stateProvider.state('upload', {
    url: '/upload',
    controller: 'Upload.controller',
    templateUrl: '/templates/upload.html',
    resolve: {
      "currentAuth": ['Auth', function (Auth) {
        return Auth.$requireAuth();
      }]
    }
  });

}]);

tableReader.constant('FIREBASE_URL', 'https://tablereader.firebaseio.com/');

tableReader.controller('Login.controller', ['$scope', 'FIREBASE_URL', '$firebaseAuth', 'currentAuth', 'Auth', '$firebaseArray', function ($scope, FIREBASE_URL, $firebaseAuth, currentAuth, Auth, $firebaseArray) {

  $scope.auth = Auth;

  $scope.auth.$onAuth(function(authData) {
    $scope.authData = authData;
  });

  var ref = new Firebase(FIREBASE_URL);
  $scope.authObj = $firebaseAuth(ref);

  $scope.login = function() {
    $scope.message = null;
    $scope.error = null;

    $scope.authObj.$authWithPassword({
      email: $scope.email,
      password: $scope.password
    }).then(function(authData) {
      console.log("Logged in as: ", authData.uid);
    }).catch(function(error) {
      console.error("Authentication failed: ", error);
    });
  }

  $scope.logout = function() {
    ref.unauth();
  };

}]);

tableReader.controller('Upload.controller', ['$scope', 'FIREBASE_URL', '$firebaseArray', 'currentAuth', function ($scope, FIREBASE_URL, $firebaseArray, currentAuth) {

  var ref = new Firebase(FIREBASE_URL); 
  
  $scope.files = $firebaseArray(ref);

  $scope.uploadCSV= function() {
    console.log($scope.file);
 
  }

  
}]);

tableReader.directive('csvReader', [function () {

  var convertToJSON = function(content) {

    var lines = content.csv.split('\n'),
      headers = lines[0].split(content.separator),
      columnCount = lines[0].split(content.separator).length,
      results = [];

    for (var i = 1; i < lines.length; i++) {

      var obj = {};

      var line = lines[i].split(new RegExp(content.separator + '(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)'));

      for (var j = 0; j < headers.length; j++) {

        obj[headers[j]] = line[j];
      }

      results.push(obj);
    }

    return results;
  };

  return {
    restrict: 'A',
    scope: {
      results: '=ngModel',
      separator: '=',
      callback: '&saveResultsCallback'
    },
    link: function (scope, element, attrs) {

      var data = {
        csv: null,
        separator: scope.separator || ','
      };

      element.on('change', function (e) {

        var files = e.target.files;

        if (files && files.lenght) {

          var reader = new FileReader();
          var file = (e.srcElement || e.target).files[0];

          reader.onload = function(e) {

            var contents = e.target.result;

            data.csv = contents;

            scope.$apply(function () {

              scope.results = convertToJSON(data);

              scope.callback(scope.result);
            });
          };

          reader.readAsText(file);
        }
      });
    }
  };
}])

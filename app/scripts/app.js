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
    templateUrl: '/templates/home.html',
    resolve: {
      "currentAuth": ['Auth', function (Auth) {
        return Auth.$requireAuth();
      }]
    }
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

tableReader.controller('Home.controller', ['$scope', '$http', 'FIREBASE_URL', '$firebaseArray', 'currentAuth', function ($scope, $http, FIREBASE_URL, $firebaseArray, currentAuth, Auth) {

  $scope.readCSV = function() {
      // http get request to read CSV file content
      $http.get('/assets/files/testCopy.csv').success($scope.processData);
    };

    $scope.processData = function(allText) {
      // split content based on new line
      var allTextLines = allText.split(/[\r\n|\n]+/);
      var headers = allTextLines[0].split(',');
      var lines = [];

      for ( var i = 0; i < allTextLines.length; i++) {
        // split content based on comma
        var data = allTextLines[i].split(',');
        if (data.length == headers.length) {
          var tarr = [];
          for ( var j = 0; j < headers.length; j++) {
            tarr.push(data[j]);
          }
          lines.push(tarr);
        }
      }
      $scope.data = lines;
    };
  

}]);

tableReader.controller('Upload.controller', ['$scope', 'FIREBASE_URL', '$firebaseArray', 'currentAuth', 'Auth', function ($scope, FIREBASE_URL, $firebaseArray, currentAuth, Auth) {

  var ref = new Firebase(FIREBASE_URL); 
  
  $scope.files = $firebaseArray(ref);

  $scope.uploadCSV= function() {
    console.log($scope.results);
 
  }

  
}]);

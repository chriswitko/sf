/**
 * Each section of the site has its own module. It probably also has
 * submodules, though this boilerplate is too simple to demonstrate it. Within
 * `src/app/home`, however, could exist several additional folders representing
 * additional modules that would then be listed as dependencies of this one.
 * For example, a `note` section could have the submodules `note.create`,
 * `note.delete`, `note.edit`, etc.
 *
 * Regardless, so long as dependencies are managed correctly, the build process
 * will automatically take take of the rest.
 *
 * The dependencies block here is also where component dependencies should be
 * specified, as shown below.
 */
angular.module( 'ngBoilerplate.home', [
  'ui.router',
  'plusOne',
  'ngCookies'
])

/**
 * Each section or module of the site can also have its own routes. AngularJS
 * will handle ensuring they are all available at run-time, but splitting it
 * this way makes each module more "self-contained".
 */
.config(function config( $stateProvider ) {
  $stateProvider.state( 'home', {
    url: '/home',
    views: {
      "main": {
        controller: 'HomeCtrl',
        templateUrl: 'home/home.tpl.html'
      }
    },
    data:{ pageTitle: 'Welcome' }
  });
})

/**
 * And of course we define a controller for our route.
 */
.controller( 'HomeCtrl', function HomeController( $scope, Facebook, $state, $http, $cookieStore ) {
  var access_token = "CAAUbE6b5y7QBAKOKJZAWlipmW8cqxSxzEFH4V0InJAqQE7GEPMJyLfZAQzkhFnu37k1JbZA4ZBOGOexFxk8hZCHlt9DSjZC8tnI9Wr4f38aUZCQ7FWM6muZC8S5YkyH3w8FEuLBFUj3ODGEYFyN2DnNsbDQi94int5SZClzBVyoVISeuOUeQj2ouHjQQouEoZCptqegj5jHxRKmTYYvq51dURuQxim1ZAKmMEAZD";
  // signed = "ksYCLUt0_-cWHkoPYFtrNTkyAVdnVgE9sw99mGa-je0.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImNvZGUiOiJBUUNhRno2Mi1SdFVSRHZ1Z1JNek45YU0tNTNaODdyeGNNQ0Jla3B3QmVRQ1loZDlSa1FZOHFoaEVpWHlLV3o0c3d5LWtET09TdW5KU2Vzc3M5N0kxRXNsdU5WaDkxNEhnZjUxa0QxMHltSkh0SW0xT3lreW1VaTZkcE5FTzZLRE1CbmdMeEVQYWVvci1XbFBBN0hDVVVwY3BFTVNOZF9jY0hWNFQxd0E1S0pfV3YwYjZCbU5DNkQwRnYzQlFIZmZBSGpsSlZFUjdsanZHeGZ4a1hjWXk3MDY1M1d4bEMwNFNJSmJjb2dBSjU5Y3VyN3VnbGhRakxJS05Vb0ZObG1ObEo2Uk1HNktfNE9icWh1dUxMYUdjallRSjl0ZXB1ZEU5bWFVTW5pcFJQVzBjdVVhTTI0dWFEcW5SQlowU0J0SFEtVUpxZ09XTXJGcFBjU3pvTW5FbkVfTiIsImlzc3VlZF9hdCI6MTQzMjM4NzU1MSwidXNlcl9pZCI6IjEwMTUzMjkzOTk3NDc0MjkzIn0"
  // userid = "10153293997474293"

  $scope.hello = function() {
    console.log('hello chris');
  };

  $scope.likes = function() {

    Facebook.api('/me/likes?access_token=' + access_token, function(response) {
      console.log(response);
    });
  };

  $scope.me = function() {
    Facebook.api('/me', function(response) {
      console.log(response);
      $scope.user = response;
    });
  };

  $scope.login = function() {
    // From now on you can use the Facebook service just as Facebook api says
    Facebook.login(function(response) {
      console.log('response', response.authResponse);
      $cookieStore.put('userID', response.authResponse.userID);
      $cookieStore.put('accessToken', response.authResponse.accessToken);
      var req = {
       method: 'POST',
       url: '/api/user/authenticate',
       headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'},
        transformRequest: function(obj) {
          var str = [];
          for(var p in obj) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
          }
          return str.join("&");
        },
        data: response.authResponse
      };

      $http(req).
        success(function(data, status, headers, config) {
          console.log('user', data);
          // $state.go('feed');
          window.location = '/#/feed';
          // window.location.assign('/#/feed');
          // window.location.reload(true);
        }).
        error(function(data, status, headers, config) {
          console.log('error');
        });

      // Do something with response.
    }, {scope: 'email,user_likes,user_location,user_friends'});
  };

  $scope.getLoginStatus = function() {
    Facebook.getLoginStatus(function(response) {
      if(response.status === 'connected') {
        alert('connected');
        $scope.loggedIn = true;
      } else {
        alert('not connected');
        $scope.loggedIn = false;
      }
    });
  };

});

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
angular.module( 'ngBoilerplate.manage', [
  'ui.router',
  'plusOne',
  'ngCookies',
  'ngLodash',
  'security'
])

/**
 * Each section or module of the site can also have its own routes. AngularJS
 * will handle ensuring they are all available at run-time, but splitting it
 * this way makes each module more "self-contained".
 */
.config(function config( $stateProvider, $cookiesProvider ) {
  var authenticated = ['$q', 'Facebook', '$cookieStore', 'lodash', function ($q, Facebook, $cookieStore, lodash) {
    var deferred = $q.defer();

    // if($cookieStore.get('userID')) {
    //   deferred.resolve();
    // } else {
    //     console.log('not connected');
    //     window.location = '/#/business';
    //     // $scope.loggedIn = false;
    //     deferred.reject('Not logged in2');
    // }
    Facebook.getLoginStatus(function(response) {
      if(response.status === 'connected') {
        Facebook.api('/me/permissions?access_token=' + $cookieStore.get('accessToken'), function(response) {
          console.log('response', response);
          var permissions = lodash.map(response.data, function(item) {
            if(item.status === 'granted') {
              return item.permission;
            }
          });
          if(permissions.indexOf('manage_pages') > -1) {
            console.log('connected2', response);
            // $scope.loggedIn = true;
            deferred.resolve();
          } else {
            window.location = '/business';
          }
        });
      } else {
        console.log('not connected');
        window.location = '/business';
        // $scope.loggedIn = false;
        deferred.reject('Not logged in2');
      }
    });

    return deferred.promise;
  }];

  $stateProvider
  .state( 'manage', {
    url: '/manage',
    views: {
      "main": {
        controller: 'ManageCtrl',
        templateUrl: 'manage/manage.tpl.html'
      }
    },
    // resolve: {
    //   authenticated: authenticated
    // },
    data:{
      pageTitle: 'ShopNow Manager 3',
      userID: $cookiesProvider['userID']
    }
  });
})

/**
 * And of course we define a controller for our route.
 */
.controller( 'ManageCtrl', function ManageCtrl( $scope, Facebook, $state, $http, $cookieStore, myAuth ) {
  $scope.init = function() {
    $scope.userID = $cookieStore.get('userID');
    console.log('hello chris');
    // myAuth.hello();
  };

  $scope.init();
});



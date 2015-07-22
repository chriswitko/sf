angular.module( 'security', [] )

.service( 'myAuth', function() {//$http, Facebook
  var vm = {};
  vm.hello = function() {
    alert('ok');
  };
  // vm.authenticated = ['$q', 'Facebook', function ($q, Facebook) {
  //   var deferred = $q.defer();

  //   Facebook.getLoginStatus(function(response) {
  //     if(response.status === 'connected') {
  //       console.log('connected');
  //       // $scope.loggedIn = true;
  //       deferred.resolve();
  //     } else {
  //       console.log('not connected');
  //       // $scope.loggedIn = false;
  //       deferred.reject('Not logged in');
  //     }
  //   });

  //   return deferred.promise;

  // }];
  return vm;
})

;


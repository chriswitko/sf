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
angular.module( 'ngBoilerplate.feed', [
  'ui.router',
  'plusOne',
  'ui.bootstrap',
  'cards.discount',
  'security'
])

/**
 * Each section or module of the site can also have its own routes. AngularJS
 * will handle ensuring they are all available at run-time, but splitting it
 * this way makes each module more "self-contained".
 */
.config(function config( $stateProvider, $urlRouterProvider ) {

  var authenticated = ['$q', 'Facebook', function ($q, Facebook) {
    var deferred = $q.defer();

    Facebook.getLoginStatus(function(response) {
      if(response.status === 'connected') {
        console.log('connected');
        // $scope.loggedIn = true;
        deferred.resolve();
      } else {
        console.log('not connected');
        // $scope.loggedIn = false;
        deferred.reject('Not logged in');
      }
    });

    return deferred.promise;
  }];

  $stateProvider.state( 'feed', {
    url: '/feed',
    views: {
      "main": {
        controller: 'FeedCtrl',
        templateUrl: 'feed/feed.tpl.html'
      }
    },
    data:{ pageTitle: 'My Feed' },
    resolve: {
      authenticated: authenticated
    }
  });
})

/**
 * And of course we define a controller for our route.
 */
.controller( 'FeedCtrl', function FeedController( $scope, $modal, $log, Facebook, myAuth ) {
  $scope.getDiscount = function(size) {
    var modalInstance = $modal.open({
      animation: true,
      templateUrl: 'myModalContent.html',
      controller: 'ModalInstanceCtrl',
      size: size,
      resolve: {
        items: function () {
          return $scope.items;
        }
      }
    });

    modalInstance.result.then(function (selectedItem) {
      $scope.selected = selectedItem;
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
  };

})

.controller('ModalInstanceCtrl', function ($scope, $modalInstance) {

  $scope.ok = function () {
    $modalInstance.close($scope.selected.item);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
});
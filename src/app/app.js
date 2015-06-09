angular.module( 'ngBoilerplate', [
  'templates-app',
  'templates-common',
  'ngBoilerplate.home',
  'ngBoilerplate.feed',
  'ngBoilerplate.explore',
  'ngBoilerplate.about',
  'ui.router',
  'facebook',
  'ngSanitize'
])

.config( function myAppConfig ( $stateProvider, $urlRouterProvider, FacebookProvider ) {
  $urlRouterProvider.otherwise( '/home' );

  FacebookProvider.setSdkVersion('v2.3');
  FacebookProvider.init('1437146103270324');
})

.run( function run (Facebook) {
})

.controller( 'AppCtrl', function AppCtrl ( $scope, $location, Facebook ) {
  $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
    if ( angular.isDefined( toState.data.pageTitle ) ) {
      $scope.pageTitle = toState.data.pageTitle + ' | FollowShops' ;
    }
    if(Facebook.isReady()) {
      Facebook.parseXFBML();
    }
  });
})

;


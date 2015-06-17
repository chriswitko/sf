angular.module( 'ngBoilerplate', [
  'templates-app',
  'templates-common',
  'ngBoilerplate.home',
  'ngBoilerplate.feed',
  'ngBoilerplate.explore',
  'ngBoilerplate.about',
  'ui.router',
  'facebook',
  'ngSanitize',
  'ui.nav',
  'ui',
  'security'
])

.config( function myAppConfig ( $stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, FacebookProvider ) {
  // $locationProvider.html5Mode(true);

  $urlRouterProvider.otherwise( '/home' );

  // $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

  FacebookProvider.setSdkVersion('v2.3');
  FacebookProvider.init('1437146103270324');


})

.run( function run ($rootScope, $state, Facebook) {
  $rootScope.$on('$stateChangeError', function () {
    // Redirect user to our login page
    $state.go('home');
  });
})

.controller( 'AppCtrl', function AppCtrl ( $scope, $location, Facebook ) {

  $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
    if ( angular.isDefined( toState.data.pageTitle ) ) {
      $scope.pageTitle = toState.data.pageTitle + ' | ShopNowApp' ;
    }
    if(Facebook.isReady()) {
      Facebook.parseXFBML();
    }
  });
})

;


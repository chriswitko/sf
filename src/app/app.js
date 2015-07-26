angular.module( 'ngBoilerplate', [
  'templates-app',
  'templates-common',
  'ngBoilerplate.home',
  'ngBoilerplate.feed',
  'ngBoilerplate.explore',
  'ngBoilerplate.about',
  'ngBoilerplate.download',
  'ngBoilerplate.business',
  'ngBoilerplate.manage',
  'ngBoilerplate.manage.dashboard',
  'ui.router',
  'facebook',
  'ngSanitize',
  'ui.nav',
  'ui',
  'security',
  'ngCookies'
])

.config( function myAppConfig ( $stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, FacebookProvider ) {
  $locationProvider.html5Mode(true);

  $urlRouterProvider.otherwise( '/home' );

  // $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

  FacebookProvider.setSdkVersion('v2.3');
  FacebookProvider.init(window.FACEBOOK_CLIENTID);


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
      $scope.pageTitle = toState.data.pageTitle + ' | ShopNow' ;
    }
    if(Facebook.isReady()) {
      Facebook.parseXFBML();
    }
  });
})

;


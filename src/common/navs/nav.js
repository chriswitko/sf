angular.module( 'ui.nav', ['nl2br', 'filters', 'ngCookies'] )

.directive( 'nav', function($http, Facebook, $state, $cookieStore) {
  return {
    restrict: 'EA',
    scope: {
      theme: '@'
    },
    templateUrl: 'navs/nav.tpl.html',
    link: function (scope, element, attrs) {
      scope.user = {};

      scope.init = function() {
        console.log('facebook', Facebook);
        if($cookieStore.get('accessToken')) {
          Facebook.api('/me?fields=link,name,first_name,picture&access_token=' + $cookieStore.get('accessToken'), function(response) {
            if(response.error) {
              scope.logout();
              return;
            }
            console.log('response', response);
            scope.user = response;
          });
        }
      };

      scope.logout = function() {
        Facebook.logout();
        $cookieStore.remove('userID');
        $cookieStore.remove('accessToken');
        // $state.go('home');
        window.location = '/';
      };

      scope.init();

    }
  };
})

;


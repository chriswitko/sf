angular.module( 'ui.nav', ['nl2br', 'filters'] )

.directive( 'nav', function($http, Facebook, $state) {
  return {
    restrict: 'EA',
    scope: {
      theme: '@'
    },
    templateUrl: 'navs/nav.tpl.html',
    link: function (scope, element, attrs) {
      scope.user = {};

      scope.init = function() {
        Facebook.api('/me?fields=link,name,first_name,picture', function(response) {
          scope.user = response;
        });
      };

      scope.logout = function() {
        Facebook.logout();
        $state.go('home');
      };

      scope.init();

    }
  };
})

;


angular.module( 'ui.nav', ['nl2br', 'filters'] )

.directive( 'nav', function($http, Facebook) {
  return {
    restrict: 'EA',
    scope: {
      postId: '@'
    },
    templateUrl: 'navs/nav.tpl.html',
    link: function (scope, element, attrs) {

    }
  };
})

;


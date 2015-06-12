angular.module( 'ui', ['nl2br', 'filters'] )

.directive( 'globalFooter', function($http, Facebook) {
  return {
    restrict: 'EA',
    scope: {
      postId: '@'
    },
    templateUrl: 'ui/globalFooter.tpl.html',
    link: function (scope, element, attrs) {

    }
  };
})

;


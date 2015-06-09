angular.module( 'cards.page', ['nl2br', 'filters'] )

.directive( 'cardFacebookPage', function($http, Facebook) {
  return {
    restrict: 'EA',
    scope: {
      pageId: '@'
    },
    templateUrl: 'cards/cardFacebookPage.tpl.html',
    link: function (scope, element, attrs) {

      console.log('page-id', scope.pageId);

    }
  };
})

;


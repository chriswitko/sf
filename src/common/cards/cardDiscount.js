angular.module( 'cards.discount', ['nl2br', 'filters', 'ngCookies'] )

.directive( 'cardDiscount', function($http, Facebook, $cookieStore) {
  return {
    restrict: 'EA',
    scope: {
      postId: '@'
    },
    templateUrl: 'cards/cardDiscount.tpl.html',
    link: function (scope, element, attrs) {
      scope.post = {};

      console.log('post-id', scope.postId);

      $http.get('https://graph.facebook.com/' + scope.postId + '?fields=' + 'name,created_time,id,link,images,source,from.fields(picture,category,id,name,likes,link),likes.fields(id,name,link,picture,summary)' + '&access_token=' + $cookieStore.get('accessToken')).
        success(function(data, status, headers, config) {
          scope.post = data;
          console.log('data', data);
        }).
        error(function(data, status, headers, config) {
          console.log('error');
        });

      scope.share = function() {
        Facebook.ui({
          method: 'share',
          href: scope.post.link
        }, function(response) {

        });
      };
    }
  };
})

;


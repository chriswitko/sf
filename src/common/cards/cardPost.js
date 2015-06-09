angular.module( 'cards.post', ['nl2br', 'filters'] )

.directive( 'cardPost', function($http, Facebook) {
  return {
    restrict: 'EA',
    scope: {
      postId: '@'
    },
    templateUrl: 'cards/cardPost.tpl.html',
    link: function (scope, element, attrs) {
      scope.post = {};

      console.log('post-id', scope.postId);

      $http.get('http://graph.facebook.com/' + scope.postId + '?fields=name,created_time,id,link,images,source,from.picture,from.category,from.id,from.name,from.likes,from.link,likes.id,likes.name,likes.link,likes.picture,likes.summary(1)').
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


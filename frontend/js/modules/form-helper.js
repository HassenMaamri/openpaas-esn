'use strict';

angular.module('esn.form.helper', [])
.factory('autosize', function($window) {
    return $window.autosize;
  })
.directive('esnTrackFirstBlur', function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, elem, attr, controller) {
      elem.one('blur', function() {
        controller._blur = true;
        if (scope.$parent) {
          scope.$parent.$digest();
        } else {
          scope.$digest();
        }
      });
    }
  };
})
.directive('passwordMatch', function() {
  return {
    restrict: 'A',
    scope: true,
    require: 'ngModel',
    link: function(scope, elem, attrs, control) {
      var checker = function() {
        var e1 = scope.$eval(attrs.ngModel);
        var e2 = scope.$eval(attrs.passwordMatch);
        return e1 === e2;
      };
      scope.$watch(checker, function(n) {
        control.$setValidity('unique', n);
      });
    }
  };
})
.directive('toggleSwitch', function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/views/modules/form/toggle-switch.html',
    scope: {
      ngModel: '=?',
      color: '@?'
    },
    link: function(scope) {
      if (scope.ngModel === undefined) {
        scope.ngModel = false;
      }
      scope.toggle = function() {
        scope.ngModel = !scope.ngModel;
      };
      scope.color = scope.color || 'blue';
    }
  };
})

.directive('esnSubmit', function() {
  return {
    restrict: 'A',
    scope: {
      submitFn: '&esnSubmit'
    },
    link: function(scope, element) {

      function disableAndSubmit(element) {
        return function() {
          element.prop('disabled', true);

          scope.submitFn().finally(function() {
            element.prop('disabled', false);
          });
        };
      }

      if (element[0] && element[0].tagName === 'FORM') {
        element.on('submit', disableAndSubmit(element.find('[type="submit"]')));
      } else {
        element.on('click', disableAndSubmit(element));
      }

    }
  };
});

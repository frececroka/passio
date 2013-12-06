(function () {

	define([
		'angular',
		'passio/core'
	], function (angular) {

		var login = angular.module('passio.login', ['passio.core']);

		login.controller('LoginController', [
			'$scope',
			'$location',
			'passwordService',
			function ($scope, $location, passwordService) {
				$scope.doLogin = function () {
					passwordService.setup($scope.user.name, $scope.user.password).then(function () {
						$location.path('/').replace();
					}, function () {
						$scope.user.password = '';
						$scope.loginFailed = true;
					});
				};
			}
		]);

	});

})();

(function () {
	'use strict';

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
					$scope.loginInProgress = true;

					// This timeout allows the button to change its text, as the setup function does heavy synchronus
					// computation for a few seconds.
					setTimeout(function () {
						passwordService.setup($scope.user.name, $scope.user.password).then(function () {
							$location.path('/').replace();
							$scope.loginInProgress = false;
						}, function () {
							$scope.user.password = '';
							$scope.loginFailed = true;
							$scope.loginInProgress = false;
						});
					}, 10);
				};
			}
		]);

	});

})();

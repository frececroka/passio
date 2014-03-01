(function () {
	'use strict';

	define([
		'angular',
		'passio/factories'
	], function (angular) {

		var login = angular.module('passio.login', ['passio.factories']);

		login.controller('LoginController', [
			'$scope',
			'$location',
			'PasswordServiceFactory',
			function ($scope, $location, PasswordServiceFactory) {
				$scope.doLogin = function () {
					$scope.loginInProgress = true;

					PasswordServiceFactory.create(
						$scope.user.name, $scope.user.password
					).then(function () {
						$location.path('/' + $scope.user.name).replace();
						$scope.loginInProgress = false;
					}, function () {
						$scope.user.password = '';
						$scope.loginFailed = true;
						$scope.loginInProgress = false;
					});
				};
			}
		]);

	});

})();

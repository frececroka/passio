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
			'PasswordService',
			function ($scope, $location, PasswordService) {
				$scope.doLogin = function () {
					$scope.loginInProgress = true;

					new PasswordService($scope.user.name, $scope.user.password).init().then(function () {
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

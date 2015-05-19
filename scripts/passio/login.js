(function () {
	'use strict';

	define([
		'angular',
		'passio/factories'
	], function (angular) {

		var login = angular.module('passio.login', ['passio.factories']);

		login.factory('UsernameHistoryService', function () {
			var UsernameHistoryService = {};

			UsernameHistoryService.localStorageSupported = function () {
				return 'localStorage' in window && window.localStorage != null;
			}

			UsernameHistoryService.getMostRecent = function () {
				if (!this.localStorageSupported()) {
					return '';
				}

				var mostRecent = localStorage.getItem('UsernameHistoryService.mostRecent');
				return mostRecent ? mostRecent : '';
			}

			UsernameHistoryService.setMostRecent = function (username) {
				if (!this.localStorageSupported()) return;
				localStorage.setItem('UsernameHistoryService.mostRecent', username);
			}

			return UsernameHistoryService;
		});

		login.controller('LoginController', [
			'$scope',
			'$location',
			'UsernameHistoryService',
			'PasswordServiceFactory',
			function ($scope, $location, UsernameHistoryService, PasswordServiceFactory) {
				$scope.user = {
					name: UsernameHistoryService.getMostRecent(),
					password: ''
				};

				$scope.doLogin = function () {
					$scope.loginInProgress = true;

					PasswordServiceFactory.create(
						$scope.user.name, $scope.user.password
					).then(function () {
						UsernameHistoryService.setMostRecent($scope.user.name);
						$location.path('/' + $scope.user.name).replace();
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

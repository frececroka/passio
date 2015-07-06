(function () {
	'use strict';

	define([
		'angular',
		'passio/factories',
		'passio/status',
	], function (angular) {

		var login = angular.module('passio.login', [
			'passio.factories',
			'passio.status',
		]);

		login.factory('UsernameHistoryService', function () {
			var UsernameHistoryService = {};

			UsernameHistoryService.localStorageSupported = function () {
				return 'localStorage' in window && window.localStorage != null;
			}

			UsernameHistoryService.getMostRecent = function () {
				if (!this.localStorageSupported()) {
					return '';
				}

				var mostRecent;
				try {
					mostRecent = localStorage.getItem('UsernameHistoryService.mostRecent');
				} catch (e) {
					// https://bugzilla.mozilla.org/show_bug.cgi?id=853234
					// We can safely ignore this, as this feature is nothing we really need.
				}

				return mostRecent ? mostRecent : '';
			}

			UsernameHistoryService.setMostRecent = function (username) {
				if (!this.localStorageSupported()) return;
				localStorage.setItem('UsernameHistoryService.mostRecent', username);
			}

			return UsernameHistoryService;
		});

		login.directive('statusBar', [
			function () {
				return {
					templateUrl: 'views/status-bar.html',
					scope: {
						statusValues: '='
					}
				};
			}
		]);

		login.directive('focusIf', [
			function () {
				return {
					restrict: 'A',
					link: function ($scope, $element) {
						$scope.$watch('focusIf', function (shouldFocus) {
							if (shouldFocus) $element.focus()
						});
					},
					scope: {
						focusIf: '='
					}
				}
			}
		]);

		login.controller('LoginController', [
			'$scope',
			'$location',
			'$timeout',
			'UsernameHistoryService',
			'PasswordServiceFactory',
			'PassioStatus',
			function ($scope, $location, $timeout, UsernameHistoryService, PasswordServiceFactory, PassioStatus) {
				$scope.user = {
					name: UsernameHistoryService.getMostRecent(),
					password: ''
				};

				$scope.autousername = !!$scope.user.name;

				$scope.statusValues = PassioStatus;

				$scope.doLogin = function () {
					$scope.loginInProgress = true;

					PasswordServiceFactory.create(
						$scope.user.name, $scope.user.password
					).then(function () {
						$timeout(function () {
							UsernameHistoryService.setMostRecent($scope.user.name);
							$location.path('/' + $scope.user.name).replace();
						});
					}, function () {
						$timeout(function () {
							$scope.user.password = '';
							$scope.loginFailed = true;
							$scope.loginInProgress = false;
						});
					});
				};
			}
		]);

	});

})();

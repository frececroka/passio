(function () {
	'use strict';

	define([
		'underscore',
		'angular',
		'passio/core',
		'bootstrap/tooltip'
	], function (_, angular) {

		var passList = angular.module('passio.passList', ['passio.core']);

		passList.controller('PassListController', [
			'$scope',
			'$location',
			'$routeParams',
			'$timeout',
			'PasswordService',
			function ($scope, $location, $routeParams, $timeout, PasswordService) {
				var passwordService = PasswordService.getInstance($routeParams.username);
				if (!passwordService) {
					$location.path('/login').replace();
					return;
				}

				var updateData = function () {
					// This timeout is neccessary as the updateData function might have been called outside of
					// AngularJS's $digest cycle.
					$timeout(function () {
						$scope.passwords = $scope.searchQuery ?
							passwordService.getBySearch($scope.searchQuery).slice(0, 5) :
							passwordService.get();

						$scope.rawData = passwordService.getRaw();
					});
				};

				updateData();
				$scope.edit = {};

				$scope.searchQuery = '';
				$scope.$watch('searchQuery', updateData);

				$scope.canUndo = function () {
					return passwordService.canUndo();
				};

				$scope.undo = function () {
					passwordService.undo().then(updateData);
				};

				$scope.canRedo = function () {
					return passwordService.canRedo();
				};

				$scope.redo = function () {
					passwordService.redo().then(updateData);
				};

				$scope.savePassword = function () {
					var id, password;

					id = $scope.edit.id;
					$scope.edit.id = null;

					if (id) {
						password = _.find($scope.passwords, function (p) {
							return p.id === id;
						});

						if (!password) {
							return;
						}
					} else {
						password = $scope.newEntry;
					}

					passwordService.put(password).then(function () {
						$scope.newEntry = {};
						updateData();
					}, function () {
						$scope.error = true;
					});

					// This call to updateData shows the submitted password immediately. The saved password
					// will have the volatile property though. The second call to updateDate (after the
					// promise has been resolved) will remove this volatile property.
					updateData();
				};

				$scope.deletePassword = function (id) {
					var password = _.find($scope.passwords, function (p) {
						return p.id === id;
					});

					password.deleted = true;
					passwordService.unput(id).then(updateData, function () {
						$scope.error = true;
					});
				};
			}
		]);

		passList.directive('matchedText', [
			function () {
				return {
					templateUrl: 'views/matched-text.html',
					scope: {
						match: '=',
						text: '='
					}
				};
			}
		]);

		passList.directive('copyablePassword', [
			function () {
				var doCopy = function (passwordValue) {
					if (!document.createRange || !window.getSelection || !document.execCommand) return false;

					var range = document.createRange();
					range.selectNodeContents(passwordValue[0].childNodes[0]);
					window.getSelection().addRange(range);

					try {
						return document.execCommand('copy');
					} catch (e) {
						console.error(e);
						return false;
					}
				};

				var link = function (scope, element, attrs) {
					var passwordWrapper = element.find('.password-wrapper');
					passwordWrapper.tooltip({
						title: 'Copy',
						placement: 'right'
					});

					var passwordValue = passwordWrapper.find('.password-value');

					var copyPassword = function () {
						passwordWrapper
							.attr('title', doCopy(passwordValue) ? 'Copied' : 'Not copied')
							.tooltip('fixTitle')
							.tooltip('show')
							.attr('title', 'Copy')
							.tooltip('fixTitle');
					};

					element.on('click', copyPassword);
					element.on('$destroy', function () {
						element.off('click', copyPassword);
					});
				};

				return {
					templateUrl: 'views/copyable-password.html',
					link: link,
					scope: {
						password: '=copyablePassword'
					}
				};
			}
		]);

	});

})();

(function () {
	'use strict';

	define([
		'underscore',
		'angular',
		'passio/core'
	], function (_, angular) {

		var passList = angular.module('passio.passList', ['passio.core']);

		passList.controller('PassListController', [
			'$scope',
			'$location',
			'$routeParams',
			'PasswordService',
			function ($scope, $location, $routeParams, PasswordService) {
				var passwordService = PasswordService.getInstance($routeParams.username);
				if (!passwordService) {
					$location.path('/login').replace();
					return;
				}

				var updateData = function () {
					$scope.passwords = $scope.searchQuery ?
						passwordService.getBySearch($scope.searchQuery).slice(0, 5) :
						passwordService.get();

					$scope.rawData = passwordService.getRaw();
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

	});

})();

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
			'passwordService',
			function ($scope, $location, passwordService) {
				if (!passwordService.isInitialized()) {
					$location.path('/login').replace();
					return;
				}

				var updateData = function () {
					$scope.passwords = passwordService.get();
					$scope.rawData = passwordService.getRaw();
				};

				updateData();
				$scope.edit = {};

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

						// Indicate that this password has not been saved yet. This property will be overwritten
						// as soon as the passwords have been saved.
						password.volatile = true;
					} else {
						password = $scope.newEntry;
					}

					passwordService.put(password).then(function () {
						$scope.newEntry = {};
						updateData();
					}, function () {
						$scope.error = true;
					});
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

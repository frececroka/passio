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

				$scope.passwords = passwordService.get();
				$scope.edit = {};

				$scope.savePassword = function (p) {
					var id, password, p;

					id = $scope.edit.id;
					$scope.edit.id = null;

					if (id) {
						password = _.find($scope.passwords, function (p) {
							return p.id === id;
						});

						if (!password) {
							return;
						}

						// update password, as p contains an id.
						p = passwordService.put(password);
					} else {
						// create password, as $scope.newEntry contains no id.
						p = passwordService.put($scope.newEntry);
					}

					$scope.passwords = passwordService.get();

					p.then(function () {
						$scope.newEntry = {};
						$scope.passwords = passwordService.get();
					}, function () {
						$scope.error = true;
					});
				};

				$scope.deletePassword = function (id) {
					passwordService.unput(id).then(function () {
						$scope.passwords = passwordService.get();
					}, function () {
						$scope.error = true;
					});
				};
			}
		]);

	});

})();

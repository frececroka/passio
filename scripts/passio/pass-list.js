(function () {

	define([
		'underscore',
		'angular',
		'passio/login'
	], function (_, angular) {

		var passList = angular.module('passList', []);

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

				$scope.addPassword = function () {
					passwordService.put($scope.newEntry);

					$scope.passwords = passwordService.get();
				};

				$scope.deletePassword = function (id) {
					passwordService.unput(id);
					$scope.passwords = passwordService.get();
				};
			}
		]);

	});

})();

require([
	'angular',
	'angular-route',
	'passio/login',
	'passio/pass-list'
], function (angular) {
	'use strict';

	var passio = angular.module('passio', ['ngRoute', 'passio.login', 'passio.passList']);

	passio.config(['$routeProvider', function ($routeProvider) {
		$routeProvider.when('/login', {
			templateUrl: 'views/login.html',
			controller: 'LoginController'
		}).when('/:username', {
			templateUrl: 'views/pass-list.html',
			controller: 'PassListController'
		}).otherwise({
			redirectTo: '/login'
		});
	}]);

	$(function () {
		angular.bootstrap(document, ['passio']);
	});
});

requirejs.config({
	baseUrl: 'scripts',
	paths: {
		'angular': 'stub'
	},
	shim: {
		'angular': {
			exports: 'angular',
			deps: ['jquery']
		}
	}
});

require([
	'angular',
	'passio/login'
], function (angular) {
	var passio = angular.module('passio', ['ngRoute', 'login']);

	passio.config(['$routeProvider', function ($routeProvider) {
		$routeProvider.when('/', {
			templateUrl: 'views/pass-list.html',
			controller: 'PassListController'
		}).when('/login', {
			templateUrl: 'views/login.html',
			controller: 'LoginController'
		}).otherwise({
			redirectTo: '/login'
		});
	}]);

	$(function () {
		angular.bootstrap(document, ['passio']);
	});
});

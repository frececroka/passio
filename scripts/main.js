requirejs.config({
	baseUrl: 'scripts',
	paths: {
		'underscore': 'vendor/underscore',
		'angular': 'vendor/angular',
		'angular-route': 'vendor/angular-route',
		'jquery': 'vendor/jquery',
		'crypto': 'vendor/crypto',
	},
	shim: {
		'underscore': {
			exports: '_'
		},
		'angular': {
			exports: 'angular',
			deps: ['jquery']
		},
		'angular-route': {
			exports: null,
			deps: ['angular']
		},
		'crypto': {
			exports: 'Crypto'
		},
		'crypto/aes': {
			exports: 'Crypto.AES',
			deps: ['crypto', 'crypto/block-modes', 'crypto/pbkdf2']
		},
		'crypto/block-modes': {
			deps: ['crypto']
		},
		'crypto/pbkdf2': {
			deps: ['crypto', 'crypto/hmac', 'crypto/sha1']
		},
		'crypto/hmac': {
			deps: ['crypto']
		},
		'crypto/sha1': {
			deps: ['crypto']
		},
		'crypto/sha256': {
			exports: 'Crypto.SHA256',
			deps: ['crypto']
		}
	}
});

require([
	'angular',
	'angular-route',
	'passio/login',
	'passio/pass-list'
], function (angular) {
	'use strict';

	var passio = angular.module('passio', ['ngRoute', 'passio.login', 'passio.passList']);

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

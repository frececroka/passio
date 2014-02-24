(function () {
	'use strict';

	define([
		'angular'
	], function (angular) {

		var passioRestMock = angular.module('passio.rest-mock', []);

		passioRestMock.service('restService', [
			'$q',
			function ($q) {
				var storage, authorizationTokens;

				storage = {};
				authorizationTokens = {};

				return {
					store: function (auth, key, value) {
						var deferred = $q.defer();

						setTimeout(function () {
							if (!authorizationTokens[key]) {
								authorizationTokens[key] = auth;
							}

							if (auth === authorizationTokens[key]) {
								storage[key] = value;
								deferred.resolve();
							} else {
								deferred.reject();
							}
						});

						return deferred.promise;
					},

					retrieve: function (key) {
						var deferred = $q.defer();

						setTimeout(function () {
							if (storage[key]) {
								deferred.resolve(storage[key]);
							} else {
								deferred.reject();
							}
						});

						return deferred.promise;
					},

					reset: function () {
						storage = {};
						authorizationTokens = {};
					}
				};
			}
		]);

	});

}());

(function () {
	'use strict';

	define([
		'angular'
	], function (angular) {

		var passioMocks = angular.module('passio.mocks.persistence', []);

		passioMocks.service('MemoryPersistenceService', [
			'$q',
			function ($q) {
				var MemoryPersistenceService = function () {
					this.storage = {};
					this.authorizationTokens = {};
				};

				MemoryPersistenceService.prototype.store = function (auth, key, value) {
					var deferred = $q.defer();

					setTimeout(function () {
						if (!this.authorizationTokens[key]) {
							this.authorizationTokens[key] = auth;
						}

						if (auth === this.authorizationTokens[key]) {
							this.storage[key] = value;
							deferred.resolve();
						} else {
							deferred.reject();
						}
					}.bind(this));

					return deferred.promise;
				};

				MemoryPersistenceService.prototype.retrieve = function (key) {
					var deferred = $q.defer();

					setTimeout(function () {
						if (this.storage[key]) {
							deferred.resolve(this.storage[key]);
						} else {
							deferred.reject();
						}
					}.bind(this));

					return deferred.promise;
				};

				return MemoryPersistenceService;
			}
		]);

	});

}());

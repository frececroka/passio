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
				};

				MemoryPersistenceService.prototype.create = function (key) {
					var deferred = $q.defer();

					setTimeout(function () {
						this.storage[key] = '';
						deferred.resolve();
					}.bind(this));

					return deferred.promise;
				};

				MemoryPersistenceService.prototype.store = function (key, value) {
					var deferred = $q.defer();

					setTimeout(function () {
						if (!key in this.storage) return deferred.reject({ status: 404 });

						this.storage[key] = value;
						deferred.resolve();
					}.bind(this));

					return deferred.promise;
				};

				MemoryPersistenceService.prototype.retrieve = function (key) {
					var deferred = $q.defer();

					setTimeout(function () {
						if (this.storage[key]) {
							deferred.resolve(this.storage[key]);
						} else {
							deferred.reject({ status: 404 });
						}
					}.bind(this));

					return deferred.promise;
				};

				return MemoryPersistenceService;
			}
		]);

	});

}());

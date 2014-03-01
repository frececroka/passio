(function () {
	'use strict';

	define([
		'angular'
	], function (angular) {

		var rest = angular.module('passio.rest', []);

		rest.factory('RestService', [
			'$http',
			function ($http) {
				/**
				 * Creates a new `RestService` to save and read values.
				 *
				 * @param {Object} options
				 * @param {String} options.backendUrl  The URL under which the backend is available.
				 */
				var RestService = function (options) {
					if (!options.backendUrl) {
						throw new Error('A backend URL is required.');
					}

					this.backendUrl = options.backendUrl;
				};

				RestService.prototype.store = function (auth, key, value) {
					return $http({
						method: 'POST',
						url: this.backendUrl + key,
						data: value,
						headers: {
							'Authorization': auth,
							'Content-Type': 'text/plain'
						}
					});
				};

				RestService.prototype.retrieve = function (key) {
					return $http({
						method: 'GET',
						url: this.backendUrl + key,
						headers: {
							'Accept': 'text/plain'
						}
					}).then(function (d) {
						return d.data;
					});
				};

				return RestService;
			}
		]);

	});

})();

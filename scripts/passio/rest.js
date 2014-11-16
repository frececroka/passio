(function () {
	'use strict';

	define([
		'angular',
		'crypto'
	], function (angular, crypto) {

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

					if (!options.encryptionService) {
						throw new Error('A encryptionService is required.');
					}

					this.backendUrl = options.backendUrl;
					this.encryptionService = options.encryptionService;
				};

				RestService.prototype.create = function (key) {
					var signingKey = crypto.enc.Base64.stringify(this.encryptionService.signingKey);

					return $http({
						method: 'PUT',
						url: this.backendUrl + key,
						headers: {
							'X-Signing-Key': signingKey,
							'Content-Type': 'text/plain'
						}
					});
				};

				RestService.prototype.store = function (key, value) {
					var mac = crypto.enc.Base64.stringify(this.encryptionService.sign(value));

					return $http({
						method: 'POST',
						url: this.backendUrl + key,
						data: value,
						headers: {
							'X-MAC': mac,
							'Content-Type': 'text/plain'
						}
					});
				};

				RestService.prototype.retrieve = function (key) {
					return $http({
						method: 'GET',
						url: this.backendUrl + key,
						// This overrides the default response transformer, which would deserialize a JSON
						// response. Since we want to return plain text in every case, this transformer needs to
						// be disabled.
						transformResponse: function (data) { return data },
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

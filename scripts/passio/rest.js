(function () {
	'use strict';

	define([
		'angular',
		'passio/encoding'
	], function (angular, encoding) {

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
					var signingKey = this.encryptionService.signingKeyBase64;

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
					return this.encryptionService.sign(value).then(function (signature) {
						signature = encoding.ab2b64(signature);
						return $http({
							method: 'POST',
							url: this.backendUrl + key,
							data: value,
							headers: {
								'X-MAC': signature,
								'Content-Type': 'text/plain'
							}
						});
					}.bind(this));
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

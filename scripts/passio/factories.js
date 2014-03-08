(function () {
	'use strict';

	define([
		'angular',
		'passio/core',
		'passio/rest',
		'passio/encryption',
		'passio/config'
	], function (angular) {

		var passioFactories = angular.module('passio.factories', [
			'passio.core',
			'passio.rest',
			'passio.encryption',
			'passio.config'
		]);

		passioFactories.factory('PasswordServiceFactory', [
			'PasswordService',
			'RestService',
			'EncryptionService',
			'config',
			function (PasswordService, RestService, EncryptionService, config) {
				return {
					/**
					 * Creates a new password service using the given username and password.
					 *
					 * @param  {String} username  The username to use.
					 * @param  {String} password  The password to use.
					 *
					 * @return {Promise} A promise which is resolved when the password service is created and
					 *     initialized.
					 */
					create: function (username, password) {
						var passwordService;

						passwordService = new PasswordService({
							username: username,
							encryptionService: new EncryptionService({
								secretKey: password,
								authIterations: config.authIterations
							}),
							persistenceService: new RestService({
								backendUrl: config.backendUrl
							})
						});

						return passwordService.init();
					}
				};
			}
		]);

	});
}());

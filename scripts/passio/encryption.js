(function () {
	'use strict';

	define([
		'angular',
		'crypto/aes',
		'passio/config'
	], function (angular, aes) {
		var encryption = angular.module('passio.encryption', ['passio.config']);

		encryption.factory('EncryptionService', [
			'$q',
			'config',
			function ($q, conf) {
				var EncryptionService = function (secretKey) {
					this.secretKey = secretKey;
				};

				/**
				 * Creates the authorization neccessary to update the upstream datastore.
				 *
				 * @return {Promise}  A promise which is resolved with the generated authorization token
				 *                    as soon as it is available.
				 */
				EncryptionService.prototype.createAuthorization = function() {
					var deferred = $q.defer();

					var authWorker = new Worker('scripts/passio/auth-token-worker.js');
					authWorker.postMessage({
						password: this.secretKey,
						authIterations: conf.authIterations
					});

					authWorker.onmessage = function (m) {
						deferred.resolve(m.data);
						authWorker.onmessage = null;
					};

					return deferred.promise;
				};

				/**
				 * Encrypts the given plaintext after stringifying it with `JSON.stringify`.
				 *
				 * @param  {Object} plain  The plaintext
				 * @return {String}  The encrypted plaintext, base64 encoded.
				 */
				EncryptionService.prototype.encrypt = function (plain) {
					plain = JSON.stringify(plain);
					return aes.encrypt(plain, this.secretKey);
				};

				/**
				 * Decrypts the given ciphertext and parses the result with `JSON.parse`. The cipertext is
				 * expected to be encoded with base64.
				 *
				 * @param  {String} cipher  The base64 encoded ciphertext.
				 * @return {Object}  The decrypted ciphertext, after being parsed with `JSON.parse`.
				 */
				EncryptionService.prototype.decrypt = function (cipher) {
					var plain = aes.decrypt(cipher, this.secretKey);
					return JSON.parse(plain);
				};

				return EncryptionService;
			}
		]);

		encryption.factory('EncryptionServiceFactory', [
			'EncryptionService',
			function (EncryptionService) {
				return {
					buildFromSecretKey: function (secretKey) {
						return new EncryptionService(secretKey);
					}
				};
			}
		]);
	});
}());

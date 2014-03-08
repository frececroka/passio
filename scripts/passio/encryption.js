(function () {
	'use strict';

	define([
		'angular',
		'crypto/aes'
	], function (angular, aes) {
		var encryption = angular.module('passio.encryption', []);

		encryption.factory('EncryptionService', [
			'$q',
			function ($q) {
				/**
				 * Creates a new `EncryptionService` to decrypt and encrypt values.
				 *
				 * @param {Object} options
				 * @param {String} options.secretKey  The secret key to use for encryption and decryption
				 *     of data.
				 * @param {Number} [options.authIterations=1000]  The number of rounds the hash function
				 *     should be applied when creating the authorization token.
				 */
				var EncryptionService = function (options) {
					if (!options.secretKey) {
						throw new Error('The secret key is required.');
					}

					options.authIterations = options.authIterations || 1000;

					this.secretKey = options.secretKey;
					this.authIterations = options.authIterations;
				};

				/**
				 * Creates the authorization neccessary to update the upstream datastore.
				 *
				 * @return {Promise}  A promise which is resolved with the generated authorization token
				 *     as soon as it is available.
				 */
				EncryptionService.prototype.createAuthorization = function() {
					var deferred = $q.defer();

					var authWorker = new Worker('scripts/passio/auth-token-worker.js');
					authWorker.postMessage({
						password: this.secretKey,
						authIterations: this.authIterations
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
	});
}());

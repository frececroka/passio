(function () {
	'use strict';

	define([
		'angular',
		'passio/subtle-encryption',
		'passio/fallback-encryption'
	], function (angular) {
		var encryption = angular.module('passio.encryption', [
			'passio.subtleencryption',
			'passio.fallbackencryption'
		]);

		encryption.factory('EncryptionService', [
			'$q',
			'SubtleEncryptionService',
			'FallbackEncryptionService',
			function ($q, SubtleEncryptionService, FallbackEncryptionService) {
				/**
				 * Creates a new `EncryptionService` to decrypt and encrypt values.
				 *
				 * @param {Object} options
				 * @param {String} options.password  The password to use for encryption and decryption
				 *     of data.
				 * @param {Number} [options.authIterations=1000]  The number of rounds the hash function
				 *     should be applied when creating the authorization token.
				 */
				var EncryptionService = function (options) {
					if (!options.password) {
						throw new Error('The secret key is required.');
					}

					options.authIterations = options.authIterations || 1000;
					this.options = options;
				};

				/**
				 * Initializes this instance's internal state.
				 *
				 * @return {Promise}  A promise which is resolved as soon as the instance is initialized.
				 */
				EncryptionService.prototype.init = function() {
					if (SubtleEncryptionService.isSupported()) {
						this.implementation = new SubtleEncryptionService(this.options);
					} else {
						this.implementation = new FallbackEncryptionService(this.options);
					}

					return this.implementation.init().then(function () {
						this.signingKeyBase64 = this.implementation.signingKeyBase64;
					}.bind(this));
				};

				/**
				 * Encrypts the given plaintext after stringifying it with `JSON.stringify`.
				 *
				 * @param  {Object} plain  The plaintext
				 * @return {String}  The encrypted plaintext, base64 encoded.
				 */
				EncryptionService.prototype.encrypt = function (plain) {
					return this.implementation.encrypt(plain);
				};

				/**
				 * Decrypts the given ciphertext and parses the result with `JSON.parse`.
				 *
				 * @param  {String} cipher  The ciphertext.
				 * @return {Object}  The decrypted ciphertext, after being parsed with `JSON.parse`.
				 */
				EncryptionService.prototype.decrypt = function (cipher) {
					return this.implementation.decrypt(cipher);
				};

				EncryptionService.prototype.sign = function (message) {
					return this.implementation.sign(message);
				};

				return EncryptionService;
			}
		]);
	});
}());

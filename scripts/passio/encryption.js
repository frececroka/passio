(function () {
	'use strict';

	define([
		'angular',
		'crypto',
		'crypto/aes',
		'crypto/hmac',
		'json-formatter',
		'crypto/sha1'
	], function (angular, crypto, aes, hmac, jsonFormatter) {
		var encryption = angular.module('passio.encryption', []);

		encryption.factory('EncryptionService', [
			'$q',
			function ($q) {
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

					this.password = options.password;
					this.authIterations = options.authIterations;
				};

				/**
				 * Creates the authorization neccessary to update the upstream datastore.
				 *
				 * @return {Promise}  A promise which is resolved with the generated authorization token
				 *     as soon as it is available.
				 */
				EncryptionService.prototype.init = function() {
					var deferred = $q.defer();

					var pbkdf2Worker = new Worker('scripts/passio/pbkdf2-worker.js');
					pbkdf2Worker.postMessage({
						password: this.password,
						length: 512,
						iterations: this.authIterations
					});

					pbkdf2Worker.onmessage = function (m) {
						var k = crypto.enc.Hex.parse(m.data).words;
						this.secretKey = crypto.lib.WordArray.create(k.slice(0, 8));
						this.signingKey = crypto.lib.WordArray.create(k.slice(8, 16));

						pbkdf2Worker.onmessage = null;

						deferred.resolve();
					}.bind(this);

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
					return aes.encrypt(plain, this.secretKey, {
						format: jsonFormatter,
						iv: crypto.lib.WordArray.random(16)
					}).toString();
				};

				/**
				 * Decrypts the given ciphertext and parses the result with `JSON.parse`. The cipertext is
				 * expected to be encoded with base64.
				 *
				 * @param  {String} cipher  The base64 encoded ciphertext.
				 * @return {Object}  The decrypted ciphertext, after being parsed with `JSON.parse`.
				 */
				EncryptionService.prototype.decrypt = function (cipher) {
					var parsedCipher = jsonFormatter.parse(cipher);
					var plain = aes.decrypt(cipher, this.secretKey, {
						format: jsonFormatter,
						iv: parsedCipher.iv
					}).toString(crypto.enc.Utf8);
					return JSON.parse(plain);
				};

				EncryptionService.prototype.sign = function (message) {
					return crypto.HmacSHA1(message, this.signingKey);
				};

				return EncryptionService;
			}
		]);
	});
}());

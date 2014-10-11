(function () {
	'use strict';

	define([
		'angular',
		'crypto',
		'crypto/aes',
		'json-formatter'
	], function (angular, crypto, aes, jsonFormatter) {
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
				EncryptionService.prototype.init = function() {
					var deferred = $q.defer();

					var pbkdf2Worker = new Worker('scripts/passio/pbkdf2-worker.js');
					pbkdf2Worker.postMessage({
						password: this.secretKey,
						length: 512,
						iterations: this.authIterations
					});

					pbkdf2Worker.onmessage = function (m) {
						var k = crypto.enc.Hex.parse(m.data).words;
						var derivedKey = crypto.lib.WordArray.create(k.slice(0, 8));
						var authKey = crypto.lib.WordArray.create(k.slice(8, 16));

						this.derivedKey = derivedKey;
						deferred.resolve(authKey.toString());

						pbkdf2Worker.onmessage = null;
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
					return aes.encrypt(plain, this.derivedKey, {
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
					var plain = aes.decrypt(cipher, this.derivedKey, {
						format: jsonFormatter,
						iv: parsedCipher.iv
					}).toString(crypto.enc.Utf8);

					return JSON.parse(plain);
				};

				return EncryptionService;
			}
		]);
	});
}());

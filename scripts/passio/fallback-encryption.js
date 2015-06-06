(function () {
	'use strict';

	define([
		'angular',
		'crypto',
		'crypto/aes',
		'crypto/hmac',
		'json-formatter',
		'crypto/sha1',
		'passio/encoding'
	], function (angular, crypto, aes, hmac, jsonFormatter, sha1, encoding) {
		var fallbackEncryption = angular.module('passio.fallbackencryption', []);

		fallbackEncryption.factory('FallbackEncryptionService', [
			'$q',
			function ($q) {
				/**
				 * Creates a new `FallbackEncryptionService` to decrypt and encrypt values.
				 *
				 * @param {Object} options
				 * @param {String} options.password  The password to use for encryption and decryption
				 *     of data.
				 * @param {Number} [options.authIterations]  The number of rounds the hash function should
				 *     be applied when creating the authorization token.
				 */
				var FallbackEncryptionService = function (options) {
					if (!options.password) {
						throw new Error('The secret key is required.');
					}

					this.password = options.password;
					this.authIterations = options.authIterations;
					this.pbkdf2WorkerPath = options.pbkdf2WorkerPath || 'scripts/passio/pbkdf2-worker.js';
				};

				/**
				 * Creates the authorization neccessary to update the upstream datastore.
				 *
				 * @return {Promise}  A promise which is resolved with the generated authorization token
				 *     as soon as it is available.
				 */
				FallbackEncryptionService.prototype.init = function() {
					var deferred = $q.defer();

					var pbkdf2Worker = new Worker(this.pbkdf2WorkerPath);
					pbkdf2Worker.postMessage({
						password: this.password,
						length: 512,
						iterations: this.authIterations
					});

					pbkdf2Worker.onmessage = function (m) {
						var k = crypto.enc.Hex.parse(m.data).words;
						this.secretKey = crypto.lib.WordArray.create(k.slice(0, 8));
						this.signingKey = crypto.lib.WordArray.create(k.slice(8, 16));
						this.signingKeyBase64 = crypto.enc.Base64.stringify(this.signingKey);

						pbkdf2Worker.terminate();
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
				FallbackEncryptionService.prototype.encrypt = function (plain) {
					var deferred, cipher;

					deferred = $q.defer();
					plain = JSON.stringify(plain);

					try {
						cipher = aes.encrypt(plain, this.secretKey, {
							format: jsonFormatter,
							iv: crypto.lib.WordArray.random(16)
						}).toString();
						deferred.resolve(cipher);
					} catch (e) {
						deferred.reject(e);
					}

					return deferred.promise;
				};

				/**
				 * Decrypts the given ciphertext and parses the result with `JSON.parse`. The cipertext is
				 * expected to be encoded with base64.
				 *
				 * @param  {String} cipher  The base64 encoded ciphertext.
				 * @return {Object}  The decrypted ciphertext, after being parsed with `JSON.parse`.
				 */
				FallbackEncryptionService.prototype.decrypt = function (cipher) {
					var deferred, parsedCipher, plain;

					deferred = $q.defer();

					try {
						parsedCipher = jsonFormatter.parse(cipher);
						plain = aes.decrypt(cipher, this.secretKey, {
							format: jsonFormatter,
							iv: parsedCipher.iv
						}).toString(crypto.enc.Utf8);

						plain = JSON.parse(plain);
						deferred.resolve(plain);
					} catch (e) {
						deferred.reject(e);
					}

					return deferred.promise;
				};

				FallbackEncryptionService.prototype.sign = function (message) {
					var sig = crypto.HmacSHA1(message, this.signingKey);
					sig = encoding.wa2ab(sig);

					var deferred = $q.defer();
					deferred.resolve(sig);
					return deferred.promise;
				};

				return FallbackEncryptionService;
			}
		]);
	});
}());

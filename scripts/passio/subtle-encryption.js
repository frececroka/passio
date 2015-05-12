(function () {
	'use strict';

	define([
		'angular',
		'passio/encoding'
	], function (angular, encoding) {

		var subtleEncryption = angular.module('passio.subtleencryption', []);

		subtleEncryption.factory('SubtleEncryptionService', [
			'$q',
			function ($q) {

				/**
				 * Creates a new `SubtleEncryptionService` to decrypt and encrypt values using the
				 * Web Crypo API.
				 *
				 * @param {Object} options
				 * @param {String} options.password  The password to use for encryption and decryption
				 *     of data.
				 * @param {Number} [options.authIterations=1000]  The number of rounds the hash function
				 *     should be applied when creating the authorization token.
				 */
				var SubtleEncryptionService = function (options) {
					if (!SubtleEncryptionService.isSupported()) {
						throw new Error('SubtleCrypto is not supported.');
					}

					if (!options.password) {
						throw new Error('The secret key is required.');
					}

					options.authIterations = options.authIterations || 1000;

					this.crypto = window.crypto.subtle;

					this.password = options.password;
					this.authIterations = options.authIterations;
				};

				SubtleEncryptionService.isSupported = function () {
					return window.crypto && window.crypto.subtle;
				}

				/**
				 * Initializes the encryption and signing keys.
				 *
				 * @return {Promise}  A promise which is resolved as soon as the instance is initialized.
				 */
				SubtleEncryptionService.prototype.init = function() {
					var password_arraybuffer = encoding.str2ab(this.password);
					return $q.all({
						masterKey: this.crypto.importKey(
							'raw',
							password_arraybuffer,
							{ name: 'PBKDF2' },
							false,
							['deriveBits']
						),
						salt: this.crypto.digest(
							{ name: 'SHA-1' },
							password_arraybuffer
						)
					}).then(function (masterKeyAndSalt) {
						return this.crypto.deriveBits(
							{
								name: 'PBKDF2',
								salt: masterKeyAndSalt.salt,
								iterations: this.authIterations,
								hash: { name: 'SHA-1' }
							},
							masterKeyAndSalt.masterKey,
							64 * 8
						);
					}.bind(this)).then(function (derivedBits) {
						var encryptionKeyBits = derivedBits.slice(0, 32);
						var signingKeyBits = derivedBits.slice(32, 64);
						this.signingKeyBase64 = encoding.ab2b64(signingKeyBits);

						return $q.all([
							this.crypto.importKey(
								'raw',
								encryptionKeyBits,
								{
									name: 'AES-CBC'
								},
								false,
								['encrypt', 'decrypt']
							),
							this.crypto.importKey(
								'raw',
								signingKeyBits,
								{
									name: 'HMAC',
									hash: { name: 'SHA-1' }
								},
								false,
								['sign']
							)
						]).then(function (importedKeys) {
							this.encryptionKey = importedKeys[0];
							this.signingKey = importedKeys[1];
						}.bind(this));
					}.bind(this));
				};

				/**
				 * Encrypts the given plaintext after stringifying it with `JSON.stringify`.
				 *
				 * @param  {Object} plain  The plaintext.
				 * @return {String}  The encrypted plaintext.
				 */
				SubtleEncryptionService.prototype.encrypt = function (plain) {
					var iv = window.crypto.getRandomValues(new Uint8Array(16));
					return this.crypto.encrypt(
						{
							name: 'AES-CBC',
							iv: iv
						},
						this.encryptionKey,
						encoding.str2ab(JSON.stringify(plain))
					).then(function (cipher) {
						return JSON.stringify({
							ct: encoding.ab2b64(cipher),
							iv: encoding.ab2b64(iv.buffer)
						});
					});
				};

				/**
				 * Decrypts the given ciphertext and parses the result with `JSON.parse`.
				 *
				 * @param  {String} cipher  The ciphertext.
				 * @return {Object}  The decrypted ciphertext, after being parsed with `JSON.parse`.
				 */
				SubtleEncryptionService.prototype.decrypt = function (cipher) {
					var cipher = JSON.parse(cipher);
					return this.crypto.decrypt(
						{
							name: 'AES-CBC',
							iv: encoding.b642ab(cipher.iv)
						},
						this.encryptionKey,
						encoding.b642ab(cipher.ct)
					).then(function (plain) {
						return JSON.parse(encoding.ab2str(plain));
					});
				};

				/**
				 * Signs the message with the signing key of this instance.
				 *
				 * @param  {String} message  The message to be signed.
				 * @return {ArrayBuffer}  The calculated signature.
				 */
				SubtleEncryptionService.prototype.sign = function (message) {
					return this.crypto.sign(
						{ name: 'HMAC' },
						this.signingKey,
						encoding.str2ab(message)
					);
				};

				return SubtleEncryptionService;
			}
		]);

	});
}());

(function () {
	'use strict';

	define([
		'chai',
		'angular',
		'passio/encryption'
	], function (chai, angular, Worker) {
		var assert = chai.assert;

		describe('encryption', function () {
			var $injector, EncryptionService;

			beforeEach(function () {
				$injector = angular.injector(['passio.encryption', 'ng']);
				EncryptionService = $injector.get('EncryptionService');
			});

			describe('encrypting and decrypting data', function () {
				it('should be able to decrypt encrypted data', function () {
					var encryptionServiceOne, encryptionServiceTwo, plain, cipher;

					encryptionServiceOne = new EncryptionService({
						secretKey: 'secret_key'
					});

					encryptionServiceTwo = new EncryptionService({
						secretKey: 'secret_key'
					});

					plain = 'This is the plain text';
					cipher = encryptionServiceOne.encrypt(plain);

					assert.strictEqual(
						plain, encryptionServiceTwo.decrypt(cipher),
						'The EncryptionService can decrypt encrypted data when using the same key.'
					);
				});

				it('should fail to decrypt data which was encrypted with a different key', function () {
					var encryptionServiceOne, encryptionServiceTwo, plain, cipher;

					encryptionServiceOne = new EncryptionService({
						secretKey: 'secret_key'
					});

					encryptionServiceTwo = new EncryptionService({
						secretKey: 'different_secret_key'
					});

					plain = 'This is the plain text';
					cipher = encryptionServiceOne.encrypt(plain);

					assert.throws(function () {
						encryptionServiceTwo.decrypt(cipher);
					});
				});
			});
		});
	});
}());

(function () {
	'use strict';

	define([
		'chai',
		'angular',
		'crypto',
		'mocks/base',
		'passio/encryption'
	], function (chai, angular, crypto) {
		var assert = chai.assert;

		describe('encryption', function () {
			var $injector, EncryptionService;

			beforeEach(function () {
				$injector = angular.injector([
					'ng',
					'passio.encryption',
					'passio.mocks.base'
				]);

				EncryptionService = $injector.get('EncryptionService');
			});

			describe('encrypting and decrypting data', function () {
				it('should be able to decrypt encrypted data', function () {
					var key1, encryptionServiceOne, encryptionServiceTwo, plain, cipher;

					key1 = crypto.lib.WordArray.random(32);

					encryptionServiceOne = new EncryptionService({ secretKey: 'secret_key' });
					encryptionServiceOne.derivedKey = key1;

					encryptionServiceTwo = new EncryptionService({ secretKey: 'secret_key' });
					encryptionServiceTwo.derivedKey = key1;

					plain = 'This is the plain text';
					cipher = encryptionServiceOne.encrypt(plain);

					assert.strictEqual(
						plain, encryptionServiceTwo.decrypt(cipher),
						'The EncryptionService can decrypt encrypted data when using the same key.'
					);
				});

				it('should fail to decrypt data which was encrypted with a different key', function () {
					var encryptionServiceOne, encryptionServiceTwo, plain, cipher;

					encryptionServiceOne = new EncryptionService({ secretKey: 'secret_key' });
					encryptionServiceOne.derivedKey = crypto.lib.WordArray.random(32);

					encryptionServiceTwo = new EncryptionService({ secretKey: 'different_secret_key' });
					encryptionServiceTwo.derivedKey = crypto.lib.WordArray.random(32);

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

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
					var secretKey1, encryptionServiceOne, encryptionServiceTwo, plain, cipher;

					secretKey1 = crypto.lib.WordArray.random(32);

					encryptionServiceOne = new EncryptionService({ password: 'secret_key' });
					encryptionServiceOne.secretKey = secretKey1;

					encryptionServiceTwo = new EncryptionService({ password: 'secret_key' });
					encryptionServiceTwo.secretKey = secretKey1;

					plain = 'This is the plain text';
					cipher = encryptionServiceOne.encrypt(plain);

					assert.strictEqual(
						plain, encryptionServiceTwo.decrypt(cipher),
						'The EncryptionService can decrypt encrypted data when using the same key.'
					);
				});

				it('should fail to decrypt data which was encrypted with a different key', function () {
					var encryptionServiceOne, encryptionServiceTwo, plain, cipher;

					encryptionServiceOne = new EncryptionService({ password: 'secret_key' });
					encryptionServiceOne.secretKey = crypto.lib.WordArray.random(32);

					encryptionServiceTwo = new EncryptionService({ password: 'different_secret_key' });
					encryptionServiceTwo.secretKey = crypto.lib.WordArray.random(32);

					plain = 'This is the plain text';
					cipher = encryptionServiceOne.encrypt(plain);

					assert.throws(function () {
						encryptionServiceTwo.decrypt(cipher);
					});
				});

				it('should be able to sign data', function () {
					var encryptionService = new EncryptionService({ password: 'secret_key' });
					encryptionService.signingKey = CryptoJS.lib.WordArray.create(
						[237476307, 1502630970, 1081900459, -1143631621]);

					assert.strictEqual(
						'a327db2e44907b543e2fe8f6aa9b091c396159fe',
						encryptionService.sign('abc die katze lief im schnee.').toString());
				});
			});
		});
	});
}());

(function () {
	'use strict';

	define([
		'chai',
		'angular',
		'passio/encoding',
		'mocks/base',
		'passio/subtle-encryption',
		'passio/fallback-encryption',
	], function (chai, angular, encoding) {
		var assert, $injector, $q, SubtleEncryptionService, FallbackEncryptionService;

		assert = chai.assert;

		$injector = angular.injector([
			'ng',
			'passio.subtleencryption',
			'passio.fallbackencryption',
			'passio.mocks.base'
		]);

		$q = $injector.get('$q');
		SubtleEncryptionService = $injector.get('SubtleEncryptionService');
		FallbackEncryptionService = $injector.get('FallbackEncryptionService');

		[{
			name: 'subtle',
			implementation: SubtleEncryptionService
		}, {
			name: 'fallback',
			implementation: FallbackEncryptionService
		}].forEach(function (params) {
			var EncryptionService = params.implementation;

			function createEncryptionService (password) {
				return new EncryptionService({
					password: password,
					authIterations: 2,
					pbkdf2WorkerPath: 'base/scripts/passio/pbkdf2-worker.js'
				});
			}

			describe('encryption ' + params.name, function () {
				it('should be able to decrypt encrypted data', function (done) {
					var encryptionServiceOne, encryptionServiceTwo, plain, cipher;

					encryptionServiceOne = createEncryptionService('secret_key');
					encryptionServiceTwo = createEncryptionService('secret_key');

					plain = 'This is the plain text';

					$q.all([
						encryptionServiceOne.init(),
						encryptionServiceTwo.init(),
					]).then(function () {
						return encryptionServiceOne.encrypt(plain);
					}).then(function (cipher) {
						return encryptionServiceTwo.decrypt(cipher);
					}).then(function (decryptedCipher) {
						assert.strictEqual(
							plain, decryptedCipher,
							'The EncryptionService can decrypt encrypted data when using the same key.'
						);
					}).then(done, done);
				});

				it('should fail to decrypt data which was encrypted with a different key', function (done) {
					var encryptionServiceOne, encryptionServiceTwo, plain, cipher;

					encryptionServiceOne = createEncryptionService('secret_key');
					encryptionServiceTwo = createEncryptionService('different_secret_key');

					plain = 'This is the plain text';

					$q.all([
						encryptionServiceOne.init(),
						encryptionServiceTwo.init(),
					]).then(function () {
						return encryptionServiceOne.encrypt(plain);
					}).then(function (cipher) {
						return encryptionServiceTwo.decrypt(cipher).then(function () {
							assert.fail();
						}, function () {});
					}).then(done, done);
				});

				it('should be able to sign data', function (done) {
					var encryptionService = createEncryptionService('secret_key');

					encryptionService.init().then(function () {
						return encryptionService.sign('abc die katze lief im schnee.');
					}).then(function (signature) {
						assert.strictEqual('2vO2NTHDtLz0a8BLua8Y9iO6a9s=', encoding.ab2b64(signature));
					}).then(done, done);
				});
			});
		});
	});
}());

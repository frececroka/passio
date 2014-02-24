(function () {
	'use strict';

	define([
		'chai',
		'angular',
		'worker-mock',
		'passio/encryption'
	], function (chai, angular, Worker) {
		var assert = chai.assert;

		describe('encryption', function () {
			var $injector, EncryptionService;

			beforeEach(function () {
				angular.module('passio.encryption');
				$injector = angular.injector(['passio.encryption', 'ng']);

				EncryptionService = $injector.get('EncryptionService');
			});

			describe('encrypting and decrypting data', function () {
				it('should be able to decrypt encrypted data', function () {
					var encryptionServiceOne, encryptionServiceTwo, plain, cipher;

					encryptionServiceOne = new EncryptionService('secret_key');
					encryptionServiceTwo = new EncryptionService('secret_key');

					plain = 'This is the plain text';
					cipher = encryptionServiceOne.encrypt(plain);

					assert.strictEqual(
						plain, encryptionServiceTwo.decrypt(cipher),
						'The EncryptionService can decrypt encrypted data when using the same key.'
					);
				});

				it('should fail to decrypt data which was encrypted with a different key', function () {
					var encryptionServiceOne, encryptionServiceTwo, plain, cipher;

					encryptionServiceOne = new EncryptionService('secret_key');
					encryptionServiceTwo = new EncryptionService('different_secret_key');

					plain = 'This is the plain text';
					cipher = encryptionServiceOne.encrypt(plain);

					assert.throws(function () {
						encryptionServiceTwo.decrypt(cipher);
					});
				});
			});

			describe('generating authorization token', function () {
				beforeEach(function () {
					Worker.init();
					Worker.mock('scripts/passio/auth-token-worker.js', function () {
						var passwords = {
							'another_password': '48a7ae7a51262c17cbbf05eafb0a3490f7caa778'
						};

						this.onmessage = function (m) {
							var authToken = 'invalid';
							if (m.data.authIterations === 1000) {
								authToken = passwords[m.data.password];
							}

							this.postMessage(authToken);
						};
					});
				});

				it('should call the authorization token worker with the right parameters', function (done) {
					new EncryptionService('another_password').createAuthorization().then(function (auth) {
						assert.strictEqual(
							'48a7ae7a51262c17cbbf05eafb0a3490f7caa778', auth,
							'The authorization token worker was called with the right parameters.'
						);
					}).then(done, done);
				});

				afterEach(function () {
					Worker.reset();
				});
			});
		});
	});
}());

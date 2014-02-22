(function () {
	'use strict';

	define([
		'underscore',
		'assert',
		'angular',
		'worker-mock',
		'passio/core',
	], function (_, assert, angular, Worker) {
		var $injector, $q;

		angular.module('passio.core');
		$injector = angular.injector(['passio.core', 'ng']);

		$q = $injector.get('$q');

		suite('core', function () {
			var passwordService, mockedBackendService;

			setup(function () {
				passwordService = $injector.get('passwordService');
				mockedBackendService = $injector.get('restService');

				mockedBackendService.store = function (auth, key, value) {
					var deferred = $q.defer();

					this.storage[key] = value;
					this.storeCalls.push({
						auth: auth,
						key: key,
						value: value
					});

					setTimeout(deferred.resolve, 0);
					return deferred.promise;
				};

				mockedBackendService.retrieve = function (key) {
					var deferred, result;

					deferred = $q.defer();
					result = this.storage[key];

					setTimeout(function () {
						if (!result) {
							deferred.reject();
						} else {
							deferred.resolve(result);
						}
					}, 0);

					this.retrieveCalls.push({
						key: key
					});

					return deferred.promise;
				};

				mockedBackendService.reset = function () {
					mockedBackendService.storage = {};
					mockedBackendService.storeCalls = [];
					mockedBackendService.retrieveCalls = [];
				};

				mockedBackendService.reset();

				Worker.init();
				Worker.mock('scripts/passio/auth-token-worker.js', function () {
					var passwords = {
						'password': '5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8',
						'another_password': '48a7ae7a51262c17cbbf05eafb0a3490f7caa778'
					};

					this.onmessage = function (m) {
						this.postMessage(passwords[m.data.password]);
					};
				});
			});

			suite('creating a new user', function () {
				setup(function (done) {
					passwordService.setup('new_user', 'password').then(done, done);
				});

				test('It should have created a new account for a new user', function () {
					assert.strictEqual(
						1, mockedBackendService.storeCalls.length,
						'mockedBackendService.store() was called one time.'
					);
				});

				test('It should have called mockedBackendService.store() with the right parameters', function () {
					var storeCall = mockedBackendService.storeCalls[0];

					assert.strictEqual(
						'5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8',
						storeCall.auth,
						'mockedBackendService.store() was called with the right authentication token.'
					);

					assert.strictEqual(
						'new_user',
						storeCall.key,
						'mockedBackendService.store() was called with the right key.'
					);
				});

				teardown(function () {
					mockedBackendService.reset();
				});
			});

			suite('loading an existing user', function () {
				setup(function (done) {
					mockedBackendService.storage = {
						'existing_user': 'UtLINJuCHnpAGGKpTfa4rPHnHNty6rqVYpwdjqxgCbpgFpn/S7Xwl1B5YjnzfEFot+EZ28UdUn4Mt7xXB8ljKYQuokbYK0ch4o4GLYY='
					};
					passwordService.setup('existing_user', 'another_password').then(done, done);
				});

				test('It should just fetch the existing data for an existing user', function () {
					assert.strictEqual(
						1, mockedBackendService.retrieveCalls.length,
						'mockedBackendService.retrieve() was called one time.'
					);
				});

				test('It should not try to create an existing user', function () {
					assert.strictEqual(
						0, mockedBackendService.storeCalls.length,
						'mockedBackendService.store() was not called.'
					);
				});

				test('It should return the correct data when calling get', function () {
					assert.deepEqual(
						[], passwordService.get(),
						'passwordService.get() returns the correct data.'
					);
				});

				teardown(function () {
					mockedBackendService.reset();
				});
			});

			suite('saving entries', function () {
				setup(function (done) {
					passwordService.setup('existing_user', 'another_password').then(done, done);
				});

				test('It should save a new entry', function (done) {
					var newEntry = {
						description: 'Amazon',
						url: 'https://www.amazon.com.au/',
						username: 'john_doe',
						password: '12345'
					};

					passwordService.put(newEntry).then(function () {
						var entries, firstEntry, storeCall;

						entries = passwordService.get();

						assert.strictEqual(
							1, entries.length,
							'passwordService.get() returns one password.'
						);

						firstEntry = entries[0];

						assert.strictEqual(
							'number', typeof firstEntry.id,
							'The id of the saved password is a number.'
						);

						assert.deepEqual(
							newEntry, _.pick(firstEntry, 'description', 'url', 'username', 'password'),
							'The saved password holds the expected data.'
						);

						assert.ok(
							firstEntry.created === firstEntry.modified,
							'The "created" and "modified" timestamp is the same.'
						);

						assert.ok(
							Math.abs(new Date().getTime() - firstEntry.created) < 500,
							'The "created" timestamp is sufficently close (<500ms) to the current timestamp'
						);

						storeCall = mockedBackendService.storeCalls[0];
						assert.strictEqual(
							'existing_user', storeCall.key,
							'mockedBackendService.store() has been called with the correct key.'
						);

						assert.strictEqual(
							'48a7ae7a51262c17cbbf05eafb0a3490f7caa778', storeCall.auth,
							'mockedBackendService.store() has been called with the correct authentication.'
						);
					}).then(done, done);
				});

				test('It should generate a password if the entry has none itself', function (done) {
					passwordService.put({
						description: 'GitHub',
						url: 'https://www.github.com/',
						username: 'john_doe'
					}).then(function () {
						var entry = passwordService.get()[0];
						assert.ok(entry.password, 'The generated password is not empty');
					}).then(done, done);
				});

				test('It should generate a password if the entry has an empty password', function (done) {
					passwordService.put({
						description: 'GitHub',
						url: 'https://www.github.com/',
						username: 'john_doe',
						password: ''
					}).then(function () {
						var entry = passwordService.get()[0];
						assert.ok(entry.password, 'The generated password is not empty');
					}).then(done, done);
				});

				test('It should be able to retrieve a saved entry from the backend', function (done) {
					var newEntry = {
						description: 'Google',
						url: 'https://www.google.com/',
						username: 'john_doe',
						password: '12345'
					};

					passwordService.setup('existing_user', 'another_password').then(function () {
						return passwordService.put(newEntry);
					}).then(function () {
						// We initialize the whole thing again, so that we can ensure that the entry has been
						// persisted.
						return passwordService.setup('existing_user', 'another_password');
					}).then(function () {
						var entries = passwordService.get();

						assert.strictEqual(
							1, entries.length,
							'One entry has been saved.'
						);

						assert.deepEqual(
							newEntry, _.pick(entries[0], 'description', 'url', 'username', 'password'),
							'The persisted entry has the same properties as the entry which was previously saved.'
						);
					}).then(done, done);
				});
			});

			suite('updating entries', function () {
				setup(function (done) {
					passwordService.setup('existing_user', 'another_password').then(function () {
						return passwordService.put({
							description: 'Google',
							url: 'https://www.google.com/',
							username: 'john_doe',
							password: '12345'
						});
					}).then(function () {
						var entry = passwordService.get()[0];
						entry.username = 'mr_doe';
						entry.password = '';
						return passwordService.put(entry);
					}).then(done, done);
				});

				test('It should not create a new entry when updating an existing entry', function () {
					var entries = passwordService.get();
					assert.equal(
						1, entries.length,
						'Updating entries creates no new entries'
					);
				});

				test('It should not save an empty password for an existing entry', function () {
					var updatedEntry = passwordService.get()[0];
					assert.ok(updatedEntry.password, 'Updating entries with an empty password doesn\'t actually save the empty password');
				});

				test('It should not use the old password an updated entry is saved with an empty password', function () {
					var updatedEntry = passwordService.get()[0];
					assert.notEqual(
						'12345', updatedEntry.password,
						'Updating entries with an empty password doesn\'t use the old password'
					);
				});

				test('It should save the updated properties when updating an entry', function () {
					var updatedEntry = passwordService.get()[0];
					assert.equal(
						'mr_doe', updatedEntry.username,
						'Updating entries updates the data delivered by passwordService.get()'
					);
				});

				teardown(function () {
					mockedBackendService.reset();
				});
			});

			suite('undoing and redoing things', function () {
				setup(function (done) {
					passwordService.setup('existing_user', 'another_password').then(done, done);
				});

				test('It should be able to undo and redo an insertion', function () {
					assert.ok(
						!passwordService.canUndo(),
						'Initially, nothing can be undone.'
					);

					passwordService.put({
						description: 'Google',
						url: 'https://www.google.com/',
						username: 'john_doe',
						password: '12345'
					});

					assert.strictEqual(
						1, passwordService.get().length,
						'Entry is available after saving it.'
					);

					assert.ok(
						passwordService.canUndo(),
						'The insertion of the entry can be undone.'
					);

					assert.ok(
						!passwordService.canRedo(),
						'After the insertion of the entry, nothing can be redone.'
					);

					passwordService.undo();

					assert.ok(
						!passwordService.canUndo(),
						'After undoing the insertion of the entry, nothing can be undone.'
					);

					assert.ok(
						passwordService.canRedo(),
						'After undoing the insertion of the entry, this action can be redone'
					);

					assert.strictEqual(
						0, passwordService.get().length,
						'After undoing the insertion of the entry, no entry is available.'
					);
				});

				test('It should be able to undo and redo an update', function () {
					var entry;

					passwordService.put({
						description: 'Goggle',
						url: 'https://www.google.com/',
						username: 'john_doe',
						password: '12345'
					});

					entry = passwordService.get()[0];

					assert.strictEqual(
						'Goggle', entry.description,
						'The entry\'s description is "Goggle" before updating it.'
					);

					entry.description = "Google";
					passwordService.put(entry);
					entry = passwordService.get()[0];

					assert.ok(
						passwordService.canUndo(),
						'After updating the entry, something can be undone.'
					);

					assert.strictEqual(
						'Google', entry.description,
						'The entry\'s description is "Google" after updatig it.'
					);

					passwordService.undo();
					entry = passwordService.get()[0];

					assert.strictEqual(
						'Goggle', entry.description,
						'The entry\'s description is "Goggle" after undoing the update.'
					);

					passwordService.redo();
					entry = passwordService.get()[0];

					assert.strictEqual(
						'Google', entry.description,
						'The entry\'s description is "Google" after redoing the update.'
					);
				});

				test('It should be able to undo and redo a deletion', function () {
					var entry;

					passwordService.put({
						description: 'Goggle',
						url: 'https://www.google.com/',
						username: 'john_doe',
						password: '12345'
					});

					assert.strictEqual(
						1, passwordService.get().length,
						'Entry is available after saving it.'
					);

					entry = passwordService.get()[0];
					passwordService.unput(entry.id);

					assert.strictEqual(
						0, passwordService.get().length,
						'No entry is available after deleting the only one.'
					);

					assert.ok(
						passwordService.canUndo(),
						'There is something to undo after deleting the entry.'
					);

					passwordService.undo();

					assert.strictEqual(
						1, passwordService.get().length,
						'The entry is there again after undoing the delete.'
					);

					entry = passwordService.get()[0];

					assert.strictEqual(
						'john_doe', entry.username,
						'The entry holds the correct username after having been resurrected.'
					);

					assert.ok(
						passwordService.canRedo(),
						'Something can be redone after unding the deletion.'
					);

					passwordService.redo();

					assert.strictEqual(
						0, passwordService.get().length,
						'No entry is available after redoing the deletion.'
					);
				});

				teardown(function () {
					mockedBackendService.reset();
				});
			});

			teardown(function () {
				Worker.restore();
			});
		});
	});
}());

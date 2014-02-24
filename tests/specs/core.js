(function () {
	'use strict';

	define([
		'underscore',
		'chai',
		'sinon',
		'angular',
		'worker-mock',
		'mocks/rest',
		'passio/core',
	], function (_, chai, sinon, angular, Worker) {
		var assert = chai.assert;

		describe('core', function () {
			var $injector, $q, PasswordService, MockedBackendService, enableBackendSpy, disableBackendSpy;

			beforeEach(function () {
				angular.module('passio.core').value('config', {
					backendUrl: "https://tests.passio.com/",
					authIterations: 1357,
					passwordLength: 32
				});

				$injector = angular.injector(['passio.core', 'passio.rest-mock', 'ng']);

				$q = $injector.get('$q');
				PasswordService = $injector.get('PasswordService');
				MockedBackendService = $injector.get('restService');

				enableBackendSpy = function () {
					return {
						'store': sinon.spy(MockedBackendService, 'store'),
						'retrieve': sinon.spy(MockedBackendService, 'retrieve')
					};
				};

				disableBackendSpy = function (spy) {
					spy.store.restore();
					spy.retrieve.restore();
				};

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

			describe('loading and accessing multiple instances of PasswordService', function () {
				it('should save a previously created instance for later access', function () {
					new PasswordService('user_one', 'her_password');

					assert.ok(
						PasswordService.getInstance('user_one'),
						'The instance for "user_one" is saved.'
					);

					assert.notOk(
						PasswordService.getInstance('user_two'),
						'The instance for "user_two" is not yet saved.'
					);

					new PasswordService('user_two', 'his_password');

					assert.ok(
						PasswordService.getInstance('user_one'),
						'The instance for "user_one" is still saved.'
					);

					assert.ok(
						PasswordService.getInstance('user_two'),
						'The instance for "user_two" is now saved as well.'
					);

					assert.notEqual(
						PasswordService.getInstance('user_one'), PasswordService.getInstance('user_two'),
						'The instances for "user_one" and "user_two" are not the same.'
					);
				});

				it('should clear saved instances after calling PasswordService.clearInstances', function () {
					new PasswordService('user_one', 'her_password');
					new PasswordService('user_two', 'his_password');
					PasswordService.clearInstances();

					assert.notOk(
						PasswordService.getInstance('user_one'),
						'The instance for "user_one" is not saved anymore after clearing all instances.'
					);

					assert.notOk(
						PasswordService.getInstance('user_two'),
						'The instance for "user_two" is not saved anymore after clearing all instances.'
					);
				});

				afterEach(function () {
					MockedBackendService.reset();
					PasswordService.clearInstances();
				});
			});

			describe('creating a new user', function () {
				var backendSpy;

				beforeEach(function (done) {
					backendSpy = enableBackendSpy();

					this.passwordService = new PasswordService('new_user', 'password');
					this.passwordService.init().then(done, done);
				});

				it('should have created a new account for a new user', function () {
					assert.strictEqual(
						1, backendSpy.store.callCount,
						'backendSpy.store() was called one time.'
					);
				});

				it('should have called backendSpy.store() with the right parameters', function () {
					assert.ok(
						backendSpy.store.calledWith('5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8', 'new_user'),
						'MockedBackendService.store() was called with the correct authentication and username'
					);
				});

				afterEach(function () {
					disableBackendSpy(backendSpy);
					MockedBackendService.reset();
					PasswordService.clearInstances();
				});
			});

			describe('loading an existing user', function () {
				var backendSpy;

				beforeEach(function (done) {
					MockedBackendService.store(
						'48a7ae7a51262c17cbbf05eafb0a3490f7caa778', 'existing_user',
						'UtLINJuCHnpAGGKpTfa4rPHnHNty6rqVYpwdjqxgCbpgFpn/S7Xwl1B5YjnzfEFot+EZ28UdUn4Mt7xXB8ljKYQuokbYK0ch4o4GLYY='
					).then(function () {
						backendSpy = enableBackendSpy();

						this.passwordService = new PasswordService('existing_user', 'another_password');
						return this.passwordService.init();
					}.bind(this)).then(done, done);
				});

				it('should just fetch the existing data for an existing user', function () {
					assert.strictEqual(
						1, backendSpy.retrieve.callCount,
						'MockedBackendService.retrieve() was called one time.'
					);
				});

				it('should not try to create an existing user', function () {
					assert.strictEqual(
						0, backendSpy.store.callCount,
						'MockedBackendService.store() was not called.'
					);
				});

				it('should return the correct data when calling get', function () {
					assert.lengthOf(
						this.passwordService.get(), 0,
						'passwordService.get() returns the correct data.'
					);
				});

				afterEach(function () {
					disableBackendSpy(backendSpy);
					MockedBackendService.reset();
					PasswordService.clearInstances();
				});
			});

			describe('saving entries', function () {
				var backendSpy;

				beforeEach(function (done) {
					backendSpy = enableBackendSpy();

					this.createPasswordService = function () {
						var passwordService = new PasswordService('existing_user', 'another_password');
						return passwordService.init().then(function () {
							return passwordService;
						});
					};

					this.createPasswordService().then(function (passwordService) {
						this.passwordService = passwordService;
					}.bind(this)).then(done, done);
				});

				it('should save a new entry', function (done) {
					var newEntry = {
						description: 'Amazon',
						url: 'https://www.amazon.com.au/',
						username: 'john_doe',
						password: '12345'
					};

					this.passwordService.put(newEntry).then(function () {
						var entries, firstEntry, storeCall;

						entries = this.passwordService.get();

						assert.lengthOf(
							entries, 1,
							'passwordService.get() returns one password.'
						);

						firstEntry = entries[0];

						assert.isNumber(
							firstEntry.id,
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

						assert.ok(
							backendSpy.store.calledWith('48a7ae7a51262c17cbbf05eafb0a3490f7caa778', 'existing_user'),
							'backendSpy.store() has been called with the correct key and authentication.'
						);
					}.bind(this)).then(done, done);
				});

				it('should generate a password if the entry has none itself', function (done) {
					this.passwordService.put({
						description: 'GitHub',
						url: 'https://www.github.com/',
						username: 'john_doe'
					}).then(function () {
						var entry = this.passwordService.get()[0];
						assert.ok(entry.password, 'The generated password is not empty');
					}.bind(this)).then(done, done);
				});

				it('should generate a password if the entry has an empty password', function (done) {
					this.passwordService.put({
						description: 'GitHub',
						url: 'https://www.github.com/',
						username: 'john_doe',
						password: ''
					}).then(function () {
						var entry = this.passwordService.get()[0];
						assert.ok(entry.password, 'The generated password is not empty');
					}.bind(this)).then(done, done);
				});

				it('should be able to retrieve a saved entry from the backend', function (done) {
					var newEntry = {
						description: 'Google',
						url: 'https://www.google.com/',
						username: 'john_doe',
						password: '12345'
					};

					this.passwordService.put(newEntry).then(function () {
						// We initialize the whole thing again, so that we can ensure that the entry has been
						// persisted.
						this.passwordService = new PasswordService('existing_user', 'another_password');
						return this.passwordService.init();
					}.bind(this)).then(function () {
						var entries = this.passwordService.get();

						assert.lengthOf(
							entries, 1,
							'One entry has been saved.'
						);

						assert.deepEqual(
							newEntry, _.pick(entries[0], 'description', 'url', 'username', 'password'),
							'The persisted entry has the same properties as the entry which was previously saved.'
						);
					}.bind(this)).then(done, done);
				});

				afterEach(function () {
					disableBackendSpy(backendSpy);
					MockedBackendService.reset();
					PasswordService.clearInstances();
				});

				it('should mark updated entries as volatile until they are actually persisted', function (done) {
					var entry;

					this.passwordService.put({
						description: 'Google',
						url: 'https://www.google.com/',
						username: 'john_doe',
						password: '12345'
					}).then(function () {
						entry = this.passwordService.get()[0];
						assert.notOk(
							entry.volatile,
							'The entry is not marked as volatile when persisted.'
						);

						return this.createPasswordService();
					}.bind(this)).then(function (passwordService) {
						entry = passwordService.get()[0];
						assert.notOk(
							entry.volatile,
							'The entry is not marked as volatile after restoring from the persistence layer.'
						);
					}).then(done, done);

					entry = this.passwordService.get()[0];
					assert.ok(
						entry.volatile,
						'The entry is marked as volatile when not persisted.'
					);
				});
			});

			describe('updating entries', function () {
				beforeEach(function (done) {
					this.passwordService = new PasswordService('existing_user', 'another_password');
					this.passwordService.init().then(function () {
						return this.passwordService.put({
							description: 'Google',
							url: 'https://www.google.com/',
							username: 'john_doe',
							password: '12345'
						});
					}.bind(this)).then(function () {
						var entry = this.passwordService.get()[0];
						entry.username = 'mr_doe';
						entry.password = '';
						return this.passwordService.put(entry);
					}.bind(this)).then(done, done);
				});

				it('should not create a new entry when updating an existing entry', function () {
					var entries = this.passwordService.get();
					assert.lengthOf(
						entries, 1,
						'Updating entries creates no new entries'
					);
				});

				it('should not save an empty password for an existing entry', function () {
					var updatedEntry = this.passwordService.get()[0];
					assert.ok(updatedEntry.password, 'Updating entries with an empty password doesn\'t actually save the empty password');
				});

				it('should not use the old password an updated entry is saved with an empty password', function () {
					var updatedEntry = this.passwordService.get()[0];
					assert.notEqual(
						'12345', updatedEntry.password,
						'Updating entries with an empty password doesn\'t use the old password'
					);
				});

				it('should save the updated properties when updating an entry', function () {
					var updatedEntry = this.passwordService.get()[0];
					assert.strictEqual(
						'mr_doe', updatedEntry.username,
						'Updating entries updates the data delivered by passwordService.get()'
					);
				});

				it('should mark updated entries as volatile until they are actually persisted', function (done) {
					var entry = this.passwordService.get()[0];

					assert.notOk(
						entry.volatile,
						'The entry is not marked as volatile when persisted.'
					);

					entry.url = 'https://www.google.com.au/';
					this.passwordService.put(entry).then(function () {
						entry = this.passwordService.get(entry.id);
						assert.notOk(
							entry.volatile,
							'The entry is not marked as volatile when persisted.'
						);
					}.bind(this)).then(done, done);

					entry = this.passwordService.get(entry.id);
					assert.ok(
						entry.volatile,
						'The entry is marked as volatile when not persisted.'
					);
				});

				afterEach(function () {
					MockedBackendService.reset();
					PasswordService.clearInstances();
				});
			});

			describe('undoing and redoing things', function () {
				beforeEach(function (done) {
					this.passwordService = new PasswordService('existing_user', 'another_password');
					return this.passwordService.init().then(done, done);
				});

				it('should be able to undo and redo an insertion', function () {
					assert.notOk(
						this.passwordService.canUndo(),
						'Initially, nothing can be undone.'
					);

					this.passwordService.put({
						description: 'Google',
						url: 'https://www.google.com/',
						username: 'john_doe',
						password: '12345'
					});

					assert.lengthOf(
						this.passwordService.get(), 1,
						'Entry is available after saving it.'
					);

					assert.ok(
						this.passwordService.canUndo(),
						'The insertion of the entry can be undone.'
					);

					assert.notOk(
						this.passwordService.canRedo(),
						'After the insertion of the entry, nothing can be redone.'
					);

					this.passwordService.undo();

					assert.notOk(
						this.passwordService.canUndo(),
						'After undoing the insertion of the entry, nothing can be undone.'
					);

					assert.ok(
						this.passwordService.canRedo(),
						'After undoing the insertion of the entry, this action can be redone'
					);

					assert.lengthOf(
						this.passwordService.get(), 0,
						'After undoing the insertion of the entry, no entry is available.'
					);
				});

				it('should be able to undo and redo an update', function () {
					var entry;

					this.passwordService.put({
						description: 'Goggle',
						url: 'https://www.google.com/',
						username: 'john_doe',
						password: '12345'
					});

					entry = this.passwordService.get()[0];

					assert.strictEqual(
						'Goggle', entry.description,
						'The entry\'s description is "Goggle" before updating it.'
					);

					entry.description = "Google";
					this.passwordService.put(entry);
					entry = this.passwordService.get()[0];

					assert.ok(
						this.passwordService.canUndo(),
						'After updating the entry, something can be undone.'
					);

					assert.strictEqual(
						'Google', entry.description,
						'The entry\'s description is "Google" after updatig it.'
					);

					this.passwordService.undo();
					entry = this.passwordService.get()[0];

					assert.strictEqual(
						'Goggle', entry.description,
						'The entry\'s description is "Goggle" after undoing the update.'
					);

					this.passwordService.redo();
					entry = this.passwordService.get()[0];

					assert.strictEqual(
						'Google', entry.description,
						'The entry\'s description is "Google" after redoing the update.'
					);
				});

				it('should be able to undo and redo a deletion', function () {
					var entry;

					this.passwordService.put({
						description: 'Goggle',
						url: 'https://www.google.com/',
						username: 'john_doe',
						password: '12345'
					});

					assert.lengthOf(
						this.passwordService.get(), 1,
						'Entry is available after saving it.'
					);

					entry = this.passwordService.get()[0];
					this.passwordService.unput(entry.id);

					assert.lengthOf(
						this.passwordService.get(), 0,
						'No entry is available after deleting the only one.'
					);

					assert.ok(
						this.passwordService.canUndo(),
						'There is something to undo after deleting the entry.'
					);

					this.passwordService.undo();

					assert.lengthOf(
						this.passwordService.get(), 1,
						'The entry is there again after undoing the delete.'
					);

					entry = this.passwordService.get()[0];

					assert.strictEqual(
						'john_doe', entry.username,
						'The entry holds the correct username after having been resurrected.'
					);

					assert.ok(
						this.passwordService.canRedo(),
						'Something can be redone after unding the deletion.'
					);

					this.passwordService.redo();

					assert.lengthOf(
						this.passwordService.get(), 0,
						'No entry is available after redoing the deletion.'
					);
				});

				afterEach(function () {
					MockedBackendService.reset();
					PasswordService.clearInstances();
				});
			});

			afterEach(function () {
				Worker.restore();
				MockedBackendService.reset();
				PasswordService.clearInstances();
			});
		});
	});
}());

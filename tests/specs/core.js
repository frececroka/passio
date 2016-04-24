(function () {
	'use strict';

	define([
		'underscore',
		'chai',
		'sinon',
		'angular',
		'crypto/pbkdf2',
		'mocks/base',
		'mocks/persistence',
		'passio/core',
		'passio/encryption',
	], function (_, chai, sinon, angular, pbkdf2) {
		var assert = chai.assert;

		describe('core', function () {
			var $injector, $q, PasswordService, MemoryPersistenceService, EncryptionService,
				createPersistenceServiceSpy, createEncryptionService, createPasswordService;

			beforeEach(function () {
				$injector = angular.injector([
					'ng',
					'passio.core',
					'passio.encryption',
					'passio.mocks.persistence',
					'passio.mocks.base'
				]);

				$q = $injector.get('$q');
				PasswordService = $injector.get('PasswordService');
				MemoryPersistenceService = $injector.get('MemoryPersistenceService');
				EncryptionService = $injector.get('EncryptionService');

				createPersistenceServiceSpy = function (passwordService) {
					return {
						store: sinon.spy(passwordService.getPersistenceService(), 'store'),
						retrieve: sinon.spy(passwordService.getPersistenceService(), 'retrieve')
					};
				};

				createEncryptionService = function (password) {
					var encryptionService, initDeferred;

					encryptionService = new EncryptionService({
						password: password,
						authIterations: 2,
						pbkdf2WorkerPath: 'base/scripts/passio/pbkdf2-worker.js'
					});

					return encryptionService;
				};

				createPasswordService = function (username, password) {
					var encryptionService, persistenceService;

					encryptionService = createEncryptionService(password);
					persistenceService = new MemoryPersistenceService();

					return new PasswordService({
						username: username,
						persistenceService: persistenceService,
						encryptionService: encryptionService
					});
				};
			});

			describe('loading and accessing multiple instances of PasswordService', function () {
				it('should save a previously created instance for later access', function () {
					createPasswordService('user_one', 'her_password');

					assert.ok(
						PasswordService.getInstance('user_one'),
						'The instance for "user_one" is saved.'
					);

					assert.notOk(
						PasswordService.getInstance('user_two'),
						'The instance for "user_two" is not yet saved.'
					);

					createPasswordService('user_two', 'his_password');

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
					createPasswordService('user_one', 'her_password');
					createPasswordService('user_two', 'his_password');

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
					PasswordService.clearInstances();
				});
			});

			describe('creating a new user', function () {
				var passwordService, persistenceServiceSpy;

				beforeEach(function (done) {
					passwordService = createPasswordService('new_user', 'password');
					persistenceServiceSpy = createPersistenceServiceSpy(passwordService);
					passwordService.init().then(done, done);
				});

				it('should have created a new account for a new user', function () {
					assert.strictEqual(
						1, persistenceServiceSpy.store.callCount,
						'memoryPersistenceService.store() was called one time.'
					);
				});

				afterEach(function () {
					PasswordService.clearInstances();
				});
			});

			describe('loading an existing user', function () {
				var passwordService, persistenceServiceSpy;

				beforeEach(function (done) {
					passwordService = createPasswordService('existing_user', 'another_password');
					passwordService.getPersistenceService().store(
						'existing_user',
						'{"ct":"xu3xOMHt222Dfq964D1iIzZgv5jsmJHc/65edr1SqGO6bX2gAefAqbEaO331rldqN2mDPfAdsxUWEgoCNv+J3Q==","iv":"NM15hmtroqkZ7jeRGuTV6A=="}'
					).then(function () {
						persistenceServiceSpy = createPersistenceServiceSpy(passwordService);
						return passwordService.init();
					}).then(done, done);
				});

				it('should just fetch the existing data for an existing user', function () {
					assert.strictEqual(
						1, persistenceServiceSpy.retrieve.callCount,
						'persistenceService.retrieve() was called one time'
					);
				});

				it('should not try to create an existing user', function () {
					assert.strictEqual(
						0, persistenceServiceSpy.store.callCount,
						'persistenceService.store() was not called'
					);
				});

				it('should return the correct data when calling get', function () {
					assert.lengthOf(
						passwordService.get(), 0,
						'passwordService.get() returns the correct data.'
					);
				});

				it('should fail if the wrong password is used', function (done) {
					var passwordServiceOne, passwordServiceTwo;

					passwordServiceOne = createPasswordService('some_user', 'password');
					passwordServiceOne.init().then(function () {
						return passwordServiceOne.put({
							description: 'CodingBat',
							url: 'http://codingbat.com/',
							username: 'some_user'
						});
					}).then(function () {
						passwordServiceTwo = createPasswordService('some_user', 'wrong_password');
						passwordServiceTwo.setPersistenceService(passwordServiceOne.getPersistenceService());
						return passwordServiceTwo.init();
					}).then(function () {
						assert.fail('The initialization with a wrong password fails.');
					}, function () {
						done();
					});
				});

				afterEach(function () {
					PasswordService.clearInstances();
				});
			});

			describe('saving entries', function () {
				var reloadPasswordService, passwordService, persistenceServiceSpy;

				beforeEach(function (done) {
					var username, password, authorization;

					username = 'some_user';
					password = 'another_password';
					authorization = '48a7ae7a51262c17cbbf05eafb0a3490f7caa778';

					reloadPasswordService = function () {
						var oldPersistenceService;

						if (passwordService) {
							oldPersistenceService = passwordService.getPersistenceService();
						}

						passwordService = createPasswordService(username, password);

						if (oldPersistenceService) {
							passwordService.setPersistenceService(oldPersistenceService);
						} else {
							persistenceServiceSpy = createPersistenceServiceSpy(passwordService);
						}

						return passwordService.init();
					};

					passwordService = createPasswordService(username, password);
					persistenceServiceSpy = createPersistenceServiceSpy(passwordService);
					passwordService.init().then(done, done);
				});

				it('should save a new entry', function (done) {
					var newEntry = {
						description: 'Amazon',
						url: 'https://www.amazon.com.au/',
						username: 'john_doe',
						password: '12345'
					};

					passwordService.put(newEntry).then(function () {
						var entries, firstEntry, storeCall;

						entries = passwordService.get();

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
							persistenceServiceSpy.store.calledWith('some_user'),
							'persistenceServiceSpy.store() has been called with the correct key.'
						);
					}).then(done, done);
				});

				it('should generate a password if the entry has none itself', function (done) {
					passwordService.put({
						description: 'GitHub',
						url: 'https://www.github.com/',
						username: 'john_doe'
					}).then(function () {
						var entry = passwordService.get()[0];
						assert.ok(entry.password, 'The generated password is not empty');
					}).then(done, done);
				});

				it('should generate a password if the entry has an empty password', function (done) {
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

				it('should be able to retrieve a saved entry from the backend', function (done) {
					var newEntry = {
						description: 'Google',
						url: 'https://www.google.com/',
						username: 'john_doe',
						password: '12345'
					};

					passwordService.put(newEntry).then(function () {
						// We initialize the whole thing again, so that we can ensure that the entry has been
						// persisted.
						return reloadPasswordService();
					}).then(function () {
						var entries = passwordService.get();

						assert.lengthOf(
							entries, 1,
							'One entry has been saved.'
						);

						assert.deepEqual(
							newEntry, _.pick(entries[0], 'description', 'url', 'username', 'password'),
							'The persisted entry has the same properties as the entry which was previously saved.'
						);
					}).then(done, done);
				});

				it('should mark updated entries as volatile until they are actually persisted', function (done) {
					var entry;

					passwordService.put({
						description: 'Google',
						url: 'https://www.google.com/',
						username: 'john_doe',
						password: '12345'
					}).then(function () {
						entry = passwordService.get()[0];
						assert.notOk(
							entry.volatile,
							'The entry is not marked as volatile when persisted.'
						);

						return reloadPasswordService();
					}).then(function () {
						entry = passwordService.get()[0];
						assert.notOk(
							entry.volatile,
							'The entry is not marked as volatile after restoring from the persistence layer.'
						);
					}).then(done, done);

					entry = passwordService.get()[0];
					assert.ok(
						entry.volatile,
						'The entry is marked as volatile when not persisted.'
					);
				});

				afterEach(function () {
					PasswordService.clearInstances();
				});
			});

			describe('updating entries', function () {
				var passwordService;

				beforeEach(function (done) {
					passwordService = createPasswordService('existing_user', 'another_password');
					passwordService.init().then(function () {
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

				it('should not create a new entry when updating an existing entry', function () {
					var entries = passwordService.get();
					assert.lengthOf(
						entries, 1,
						'Updating entries creates no new entries'
					);
				});

				it('should not save an empty password for an existing entry', function () {
					var updatedEntry = passwordService.get()[0];
					assert.ok(updatedEntry.password, 'Updating entries with an empty password doesn\'t actually save the empty password');
				});

				it('should not use the old password an updated entry is saved with an empty password', function () {
					var updatedEntry = passwordService.get()[0];
					assert.notEqual(
						'12345', updatedEntry.password,
						'Updating entries with an empty password doesn\'t use the old password'
					);
				});

				it('should save the updated properties when updating an entry', function () {
					var updatedEntry = passwordService.get()[0];
					assert.strictEqual(
						'mr_doe', updatedEntry.username,
						'Updating entries updates the data delivered by passwordService.get()'
					);
				});

				it('should mark updated entries as volatile until they are actually persisted', function (done) {
					var entry = passwordService.get()[0];

					assert.notOk(
						entry.volatile,
						'The entry is not marked as volatile when persisted.'
					);

					entry.url = 'https://www.google.com.au/';
					passwordService.put(entry).then(function () {
						entry = passwordService.getById(entry.id);
						assert.notOk(
							entry.volatile,
							'The entry is not marked as volatile when persisted.'
						);
					}).then(done, done);

					entry = passwordService.getById(entry.id);
					assert.ok(
						entry.volatile,
						'The entry is marked as volatile when not persisted.'
					);
				});

				afterEach(function () {
					PasswordService.clearInstances();
				});
			});

			describe('undoing and redoing things', function () {
				var passwordService;

				beforeEach(function (done) {
					passwordService = createPasswordService('some_user', 'another_password');
					passwordService.init().then(done, done);
				});

				it('should be able to undo and redo an insertion', function () {
					assert.notOk(
						passwordService.canUndo(),
						'Initially, nothing can be undone.'
					);

					passwordService.put({
						description: 'Google',
						url: 'https://www.google.com/',
						username: 'john_doe',
						password: '12345'
					});

					assert.lengthOf(
						passwordService.get(), 1,
						'Entry is available after saving it.'
					);

					assert.ok(
						passwordService.canUndo(),
						'The insertion of the entry can be undone.'
					);

					assert.notOk(
						passwordService.canRedo(),
						'After the insertion of the entry, nothing can be redone.'
					);

					passwordService.undo();

					assert.notOk(
						passwordService.canUndo(),
						'After undoing the insertion of the entry, nothing can be undone.'
					);

					assert.ok(
						passwordService.canRedo(),
						'After undoing the insertion of the entry, this action can be redone'
					);

					assert.lengthOf(
						passwordService.get(), 0,
						'After undoing the insertion of the entry, no entry is available.'
					);
				});

				it('should be able to undo and redo an update', function () {
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

				it('should be able to undo and redo a deletion', function () {
					var entry;

					passwordService.put({
						description: 'Goggle',
						url: 'https://www.google.com/',
						username: 'john_doe',
						password: '12345'
					});

					assert.lengthOf(
						passwordService.get(), 1,
						'Entry is available after saving it.'
					);

					entry = passwordService.get()[0];
					passwordService.unput(entry.id);

					assert.lengthOf(
						passwordService.get(), 0,
						'No entry is available after deleting the only one.'
					);

					assert.ok(
						passwordService.canUndo(),
						'There is something to undo after deleting the entry.'
					);

					passwordService.undo();

					assert.lengthOf(
						passwordService.get(), 1,
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

					assert.lengthOf(
						passwordService.get(), 0,
						'No entry is available after redoing the deletion.'
					);
				});

				afterEach(function () {
					PasswordService.clearInstances();
				});
			});

			describe('searching for entries', function () {
				var passwordService;

				beforeEach(function (done) {
					passwordService = createPasswordService('some_user', 'another_password');
					passwordService.init().then(function () {
						return passwordService.put({
							description: 'Google',
							url: 'https://www.google.com/',
							username: 'eric',
							password: 'do_not_search_for_this_password'
						});
					}).then(function () {
						return passwordService.put({
							description: 'Amazon',
							url: 'https://www.amazon.com.au/',
							username: 'john_doe',
							password: '12345'
						});
					}).then(function () {
						return passwordService.put({
							description: 'GitHub',
							// We omit the URL for a purpose, because we want to test that searching for "github"
							// (lowercase) still returns the entry with the description "GitHub" (mixed case).
							// Including the URL somehow defeats this purpose, because the URL includes the
							// lowercase "github".
							username: 'mr_mattingly'
						});
					}).then(function () {
						return passwordService.put({
							description: 'Criticker',
							url: 'http://www.criticker.com/',
							username: 'raymond_mattingly',
							password: '12345'
						});
					}).then(function () {
						return passwordService.put({
							description: 'CodingBat',
							url: 'http://codingbat.com/',
							username: 'h_omar'
						});
					}).then(function () {
						return passwordService.put({
							description: 'TravisCI',
							url: 'https://travis-ci.org/',
							username: 'homer_simpson'
						});
					}).then(done, done);
				});

				it('should find nothing when search for the emtpy string', function () {
					assert.lengthOf(
						passwordService.getBySearch(''), 0,
						'A search for an empty string returns no results'
					);
				});

				it('should find the GitHub account even if the capitalization does not match', function () {
					assert.strictEqual(
						passwordService.getBySearch('github')[0].description, 'GitHub',
						'Searching for "github" returns the GitHub account'
					);
				});

				it('should not search for actual passwords', function () {
					assert.lengthOf(
						passwordService.getBySearch('do_not_search_for_this_password'), 0,
						'Search for a password does not return the entry containing the password'
					);
				});

				it('should be able find more than one result', function () {
					assert.lengthOf(
						passwordService.getBySearch('mattingly'), 2,
						'It is able to find more than one result'
					);
				});

				it.skip('should perform fuzzy-matching', function () {
					console.log(passwordService.getBySearch('raymatti'));
					assert.lengthOf(
						passwordService.getBySearch('raymatti'), 1,
						'Searching for "raymatti" returns the entry with the username "raymond_mattingly"'
					);
				});

				it.skip('should write the matching slices on the entries', function () {
					var searchResult = passwordService.getBySearch('raymatt');

					assert.deepEqual(
						searchResult[0].$username, [
							{ slice: 'raym', match: true },
							{ slice: 'ond_m', match: false },
							{ slice: 'att', match: true },
							{ slice: 'ingly', match: false }
						], 'The search result contains the matched slices'
					);
				});

				it('should rank search results by the length of their match', function () {
					// We are searching for "hom", which will match
					//
					//  + |hom|er_simpson
					//  + |h|_|om|ar
					//  + |h|ttp://codingbat.c|om|/
					//  + |h|ttps://www.google.c|om|/
					//  + |h|ttps://www.amazon.c|om|.au/
					//  + |h|ttp://www.criticker.c|om|/
					//
					// The second result's (h_omar) purpose is to avoid that matches are greedy (matching
					// "|ho|mer_si|m|pson" instead of "|hom|er_simpson").
					var searchResults = passwordService.getBySearch('hom');

					assert.lengthOf(
						searchResults, 5,
						'Searching for "hom" matches 5 entries'
					);

					assert.strictEqual(
						searchResults[0].username, 'homer_simpson',
						'The first (most relevant) match is "homer_simpson"'
					);

					assert.strictEqual(
						searchResults[1].username, 'h_omar',
						'The first (most relevant) match is "h_omar"'
					);

					assert.strictEqual(
						searchResults[4].url, 'http://www.criticker.com/',
						'The last (least relevant) match is "http://www.criticker.com/"'
					);
				});

				afterEach(function () {
					PasswordService.clearInstances();
				});
			});

			afterEach(function () {
				PasswordService.clearInstances();
			});
		});
	});
}());

(function () {
	'use strict';

	define([
		'underscore',
		'angular',
		'passio/config',
		'passio/rest',
		'passio/encryption'
	], function (_, angular, conf) {

		var core = angular.module('passio.core', ['passio.rest', 'passio.encryption']);

		core.factory('PasswordService', [
			'$q',
			'restService',
			'EncryptionServiceFactory',
			function ($q, storage, EncryptionServiceFactory) {
				/**
				 * Creates a new, uninitialized instance of PasswordService using the given username and
				 * password. To initialize this instance, the `init` method has to be called.
				 *
				 * @param {String} username  The username
				 * @param {String} password  The password
				 */
				var PasswordService = function (username, password) {
					this.username = username;
					this.encryptionService = EncryptionServiceFactory.buildFromSecretKey(password);

					PasswordService.instances[username] = this;
				};

				PasswordService.instances = {};
				PasswordService.getInstance = function (username) {
					return PasswordService.instances[username];
				};

				PasswordService.clearInstances = function () {
					PasswordService.instances = {};
				};

				PasswordService.prototype = {
					/**
					 * A list of properties of individual entries that can be passed on to the persistence
					 * layer. Some internal properties are not suited for persistence, for example the
					 * 'volatile' property.
					 *
					 * @type {Array}
					 */
					persistableProperties: ['id', 'description', 'url', 'username', 'password'],

					/**
					 * Tries to obtain the neccessary information to read and write password entries for this
					 * instance.
					 *
					 * @return {Promise}  A promise which is resolved when all neccessary information are
					 *                    gathered and which is rejected when the process failed.
					 */
					init: function () {
						return this.encryptionService.createAuthorization().then(function (auth) {
							this.auth = auth;
							return storage.retrieve(this.username);
						}.bind(this)).then(function (data) {
							this.encryptedData = data;
							this.data = this.encryptionService.decrypt(data);

							// Older accounts don't have a undo and redo history.
							this.data.undoHistory = this.data.undoHistory || [];
							this.data.redoHistory = this.data.redoHistory || [];
						}.bind(this), function () {
							this.data = {
								nextId: 1,
								passwords: [],
								undoHistory: [],
								redoHistory: []
							};

							return this.updateUpstream();
						}.bind(this));
					},

					/**
					 * Returns true if passwords are loaded and new passwords can be added. False if not.
					 *
					 * @return {Boolean}  True if passwords can be read and written. False if not.
					 */
					isInitialized: function () {
						return this.data && this.auth;
					},

					/**
					 * Creates a new password entry or updates an existing one. If an ID is given, the
					 * password with a matching ID is replaced by the given password entry. If no password
					 * with a matching ID is found, nothing is done. If no ID is given, a new password is
					 * created.
					 *
					 * @param {Object} entry  An object describing the password.
					 * @param {Integer} [entry.id]  The ID of the password.
					 * @param {String} [entry.description]  A short description of the password.
					 * @param {String} [entry.url]  The URL of the page associated with this password.
					 * @param {String} [entry.username]  The username associated with this password.
					 * @param {String} [entry.password]  The actual password. If it is empty, a random
					 *                                   password will be generated.
					 * @param {Object} [options]  An object modifying the behaviour of this function.
					 * @param {Array} [options.historyTarget]  A custom history list where the action should
					 *                                         be appended to.
					 * @param {Boolean} [options.keepRedo]  Whether the redo history should be kept or not.
					 *
					 * @return {Promise} A promise which will be resolved if the password was successfully
					 *                   saved or rejected if not.
					 */
					put: function (entry, options) {
						options = options || {};

						// Delete an empty password with undefined, so it will be extended by _ with a
						// generated one.
						if (!entry.password) {
							delete entry['password'];
						}

						entry = _.extend({
							'description': '',
							'url': '',
							'username': '',
							'password': this.generatePassword(conf.passwordLength)
						}, entry || {});

						entry = _.pick(entry, this.persistableProperties);
						entry.volatile = true;

						if (!entry.id || options.forceCreate) {
							if (!entry.id) {
								entry.id = this.data.nextId;
								this.data.nextId += 1;

								entry.created = new Date().getTime();
								entry.modified = entry.created;
							}

							this.data.passwords.push(entry);

							this.addHistory({
								action: 'create',
								id: entry.id
							}, options.historyTarget, { keepRedo: options.keepRedo });
						} else {
							var historyEntry = {
								action: 'update',
								id: entry.id,
								properties: []
							};

							_.each(this.data.passwords, function (p, i, passwords) {
								if (p.id === entry.id) {
									// we update the modified time if the password was changed
									entry.modified = entry.password !== p.password ? new Date().getTime() : p.modified;
									entry.created = p.created;

									['description', 'url', 'username', 'password'].forEach(function (key) {
										if (entry[key] !== p[key]) {
											historyEntry.properties.push({
												key: key,
												before: p[key],
												after: entry[key]
											});
										}
									});

									passwords[i] = entry;
								}
							});

							this.addHistory(historyEntry, options.historyTarget, { keepRedo: options.keepRedo });
						}

						return this.updateUpstream();
					},

					/**
					 * Obtains a list of all currently stored passwords. Changes to this array are not
					 * persisted. If an ID is given, only the password with the given ID is returned.
					 *
					 * @param {Integer} [id] The ID of the password to return. If ommitted, all passwords are
					 *                       returned.
					 *
					 * @return {Array|Object}  An array containing all stored passwords (If no ID is given) or
					 *                         the password with the given ID.
					 */
					get: function (id) {
						if (id) {
							var entry = _.filter(this.data.passwords, function (d) {
								return d.id === id;
							});

							if (entry.length) {
								return _.clone(entry[0]);
							}

							return null;
						}

						var clonedData = [];

						_.each(this.data.passwords, function (d) {
							clonedData.push(_.clone(d));
						});

						return clonedData;
					},

					/**
					 * Returns the raw encrypted data.
					 *
					 * @return {String} The raw data.
					 */
					getRaw: function () {
						return this.encryptedData;
					},

					/**
					 * Deletes the password with the given ID.
					 *
					 * @param {Integer} id  The ID of the password to delete.
					 * @param {Object} [options]  An object modifying the behaviour of this function.
					 * @param {Array} [options.historyTarget]  A custom history list where the action should
					 *                                         be appended to.
					 * @param {Boolean} [options.keepRedo]  Whether the redo history should be kept or not.
					 *
					 * @return {Promise}  A promise which is resolved when the password has been deleted and
					 *                    which is rejected when the deletion was not successful.
					 */
					unput: function (id, options) {
						options = options || {};

						this.data.passwords = _.reject(this.data.passwords, function (p) {
							if (p.id === id) {
								this.addHistory({
									action: 'delete',
									entry: p
								}, options.historyTarget, { keepRedo: options.keepRedo });

								return true;
							} else {
								return false;
							}
						}.bind(this));

						return this.updateUpstream();
					},

					/**
					 * Adds the given history item to the given history target. If no history target is given,
					 * the undo history is used by default. If `options.keepRedo` is false, the redo history
					 * is emptied. Commonly, this is used when the user modified the data, which might break
					 * the redo actions.
					 *
					 * Example: Assume our redo history contains the following data:
					 *
					 *     [
					 *       {
					 *         "action": "update",
					 *         "id": 4,
					 *         "properties": [
					 *           {
					 *             "key": "description",
					 *             "before": "This is the title after the change",
					 *             "after": "This was the title before the change"
					 *           }
					 *         ]
					 *       }
					 *     ]
					 *
					 * Assume further that the user now deletes the password with `id` 4. The redo history is
					 * now broken, because we cannot apply the described change to an item which doesn't
					 * exist. To avoid situations like this, the redo history should be cleared as soon as the
					 * user modified the data.
					 *
					 * @param {Object} action  An object describing a change.
					 * @param {String} action.action  The type of the change. Might be `create`, `update` or
					 *                               `delete`.
					 * @param {Integer} action.id  The ID of the changed password.
					 * @param {Object} [options]  An object influencing the behaviour of this function.
					 * @param {Array} [options.historyTarget]  The history list the action should be appended
					 *                                         to. Defaults to `this.data.undoHistory`.
					 * @param {Boolean} [options.keepRedo]  Whether to keep the redo history or not. Defaults
					 *                                      to `false`.
					 */
					addHistory: function (action, historyTarget, options) {
						options = options || {};

						(historyTarget || this.data.undoHistory).push(action);
						if (!options.keepRedo) {
							this.data.redoHistory = [];
						}
					},

					/**
					 * Revert the change described by `action`.
					 *
					 * @param {Object} action  An object describing a change. See the documentation of
					 *                         `addHistory` for further information about this object.
					 * @param {Object} [options]  An object influencing the behaviour of this function.
					 * @param {Array} [options.historyTarget]  The history list to which the inversed action
					 *                                         is appended. For example if we are reverting a
					 *                                         change from the undo history, a new history
					 *                                         entry which would undo the undo can be appended
					 *                                         to the redo history. This options defaults to
					 *                                         the undo history.
					 *
					 * @return {Promise}  A promise which is resolved when the action is reverted and saved.
					 */
					revert: function (action, options) {
						options = options || {};
						options = _.extend({
							keepRedo: true
						}, options);

						switch (action.action) {
							case 'create':
								return this.unput(action.id, {
									keepRedo: options.keepRedo,
									historyTarget: options.historyTarget
								});

							case 'update':
								var entry = this.get(action.id);
								action.properties.forEach(function (p) {
									entry[p.key] = p.before;
								});

								return this.put(entry, {
									keepRedo: options.keepRedo,
									historyTarget: options.historyTarget
								});

							case 'delete':
								return this.put(action.entry, {
									keepRedo: options.keepRedo,
									historyTarget: options.historyTarget,
									forceCreate: true
								});
						}
					},

					/**
					 * Whether there are actions which can be undone or not.
					 *
					 * @return {Boolean}  Returns `true` if there are actions to undo, `false` if not.
					 */
					canUndo: function () {
						return this.data.undoHistory.length > 0;
					},

					/**
					 * Undoes the latest action.
					 *
					 * @return {Promise}  A promise which is resolved when the latest action is undone and
					 *                    saved.
					 */
					undo: function () {
						if (this.canUndo()) return this.revert(this.data.undoHistory.pop(), {
							historyTarget: this.data.redoHistory
						});
					},


					/**
					 * Whether there are actions which can be redone or not.
					 *
					 * @return {Boolean}  Returns `true` if there are actions to redo, `false` if not.
					 */
					canRedo: function () {
						return this.data.redoHistory.length > 0;
					},

					/**
					 * Redoes the latest undone action.
					 *
					 * @return {Promise}  A promise which is resolved when the latest undo is undone and
					 *                    saved.
					 */
					redo: function () {
						if (this.canRedo()) return this.revert(this.data.redoHistory.pop(), {
							historyTarget: this.data.undoHistory
						});
					},

					/**
					 * Updates the upstream datastore with the data from `this.data`.
					 *
					 * @return {Promise}  A promise which is resolved when the update was successful and which
					 *                    is rejected when the update failed.
					 */
					updateUpstream: function () {
						var data, ids, cipher;

						data = _.clone(this.data);
						data.passwords = _.map(data.passwords, function (e) {
							return _.pick(e, this.persistableProperties);
						}.bind(this));

						ids = _.map(data.passwords, function (p) {
							return p.id;
						});

						cipher = this.encryptionService.encrypt(data);
						return storage.store(this.auth, this.username, cipher).then(function () {
							this.encryptedData = cipher;

							_.chain(this.data.passwords).filter(function (p) {
								return _.contains(ids, p.id);
							}).each(function (p) {
								delete p.volatile;
							});
						}.bind(this));
					},

					/**
					 * Generates a random password consisting of characters chosen from a pool of 66
					 * characters. The generated password will have the length given by `len`.
					 *
					 * @param {Integer} len  The length of the generated password.
					 *
					 * @return {String}  A random 15-character password.
					 */
					generatePassword: function (len) {
						var characterPool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_-=.';
						var password = '';

						while (password.length < len) {
							password += characterPool.charAt(Math.round(Math.random() * (characterPool.length - 1)));
						}

						return password;
					}
				};

				return PasswordService;
			}
		]);

	});

})();

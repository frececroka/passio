(function () {
	'use strict';

	define([
		'underscore',
		'angular',
		'crypto/aes',
		'crypto/sha256',
		'passio/config',
		'passio/rest'
	], function (_, angular, aes, sha256, conf) {

		var core = angular.module('passio.core', ['passio.rest']);

		core.factory('passwordService', [
			'restService',
			'$q',
			function (storage, $q) {
				return {
					/**
					 * Tries to obtain the neccessary information to read and write password entries for the
					 * given user.
					 *
					 * @param {String} username  The username
					 * @param {String} password  The password
					 *
					 * @return {Promise}  A promise which is resolved when all neccessary information are
					 *                    gathered and which is rejected when the process failed.
					 */
					setup: function (username, password) {
						this.username = username;
						this.password = password;

						return $q.all([storage.retrieve(username).then(function (data) {
							data = aes.decrypt(data, password);
							this.data = JSON.parse(data);
						}.bind(this), function () {
							this.data = {
								nextId: 1,
								passwords: []
							};

							return this.updateUpstream();
						}.bind(this)), this.createAuthorization()]);
					},

					/**
					 * Creates the authorization neccessary to update the upstream datastore.
					 *
					 * @return {Promise}  A promise which is resolved when the authorization token has been
					 *                    created and written to `this.auth`.
					 */
					createAuthorization: function () {
						var loops = conf.authIterations;
						var start = new Date().getTime();
						var promise = $q.defer();

						var run = function () {
							for (var i = 0; i < 100 && loops; i++) {
								this.auth = this.auth ? sha256(this.auth) : sha256(this.password);
								loops -= 1;
							}

							if (loops) {
								setTimeout(run, 0);
							} else {
								promise.resolve();
							}
						}.bind(this);

						run();
						return promise.promise;
					},

					tearDown: function() {
						this.data = undefined;
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
					 *
					 * @return {Promise} A promise which will be resolved if the password was successfully
					 *                   saved or rejected if not.
					 */
					put: function (entry) {
						entry = _.extend({
							'description': '',
							'url': '',
							'username': '',
							'password': this.generatePassword(15)
						}, entry || {});

						entry = _.pick(entry, 'id', 'description', 'url', 'username', 'password');

						if (!entry.id) {
							entry.id = this.data.nextId;
							this.data.nextId += 1;

							entry.created = entry.modified;
							this.data.passwords.push(entry);
						} else {
							_.each(this.data.passwords, function (p, i, passwords) {
								if (p.id === entry.id) {
									// we update the modified time if the password was changed
									entry.modified = entry.password !== p.password ? new Date().getTime() : p.modified;
									entry.created = p.created;

									passwords[i] = entry;
								}
							});
						}

						return this.updateUpstream();
					},

					/**
					 * Obtains a list of all currently stored passwords. Changes to this array are not
					 * persisted.
					 *
					 * @return {Array}  An array containing all stored passwords.
					 */
					get: function () {
						var clonedData = [];

						_.each(this.data.passwords, function (d) {
							clonedData.push(_.clone(d));
						});

						return clonedData;
					},

					/**
					 * Deletes the password with the given ID.
					 *
					 * @param  {Integer} id  The ID of the password to delete.
					 * @return {Promise}  A promise which is resolved when the password has been deleted and
					 *                    which is rejected when the deletion was not successful.
					 */
					unput: function (id) {
						this.data.passwords = _.reject(this.data.passwords, function (p) {
							return p.id === id;
						});

						return this.updateUpstream();
					},

					/**
					 * Updates the upstream datastore with the data from `this.data`.
					 *
					 * @return {Promise}  A promise which is resolved when the update was successful and which
					 *                    is rejected when the update failed.
					 */
					updateUpstream: function () {
						var data = JSON.stringify(this.data);
						data = aes.encrypt(data, this.password);

						return storage.store(this.auth, this.username, data);
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
			}
		]);

	});

})();

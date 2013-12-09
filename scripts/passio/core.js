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

					isInitialized: function () {
						return this.data && this.auth;
					},

					put: function (entry) {
						entry = _.extend({
							'description': '',
							'url': '',
							'username': '',
							'password': this.generatePassword()
						}, entry || {});

						entry = _.pick(entry, 'description', 'url', 'username', 'password');
						entry.id = this.data.nextId;
						this.data.nextId += 1;

						entry.created = new Date().getTime();
						entry.modified = entry.created;

						this.data.passwords.push(entry);
						return this.updateUpstream();
					},

					get: function () {
						var clonedData = [];

						_.each(this.data.passwords, function (d) {
							clonedData.push(_.clone(d));
						});

						return clonedData;
					},

					unput: function (id) {
						this.data.passwords = _.reject(this.data.passwords, function (p) {
							return p.id === id;
						});

						return this.updateUpstream();
					},

					updateUpstream: function () {
						var data = JSON.stringify(this.data);
						data = aes.encrypt(data, this.password);

						return storage.store(this.auth, this.username, data);
					},

					generatePassword: function () {
						var characterPool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_-=.';
						var password = '';

						while (password.length < 15) {
							password += characterPool.charAt(Math.round(Math.random() * (characterPool.length - 1)));
						}

						return password;
					}
				};
			}
		]);

	});

})();

(function () {
	'use strict';

	define([
		'underscore',
		'angular',
		'crypto/aes',
		'passio/firebase'
	], function (_, angular, aes) {

		var core = angular.module('passio.core', ['passio.firebase']);

		core.factory('passwordService', [
			'firebaseService',
			function (storage) {
				return {
					setup: function (username, password) {
						var _this = this;

						this.username = username;
						this.password = password;

						return storage.retrieve(username).then(function (data) {
							if (!data) {
								_this.data = {
									nextId: 1,
									passwords: []
								};
								_this.updateUpstream();
							} else {
								data = aes.decrypt(data, password);
								_this.data = JSON.parse(data);
							}
						});
					},

					tearDown: function() {
						this.data = undefined;
					},

					isInitialized: function () {
						return !!this.data;
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
						this.updateUpstream();
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

						this.updateUpstream();
					},

					updateUpstream: function () {
						var data = JSON.stringify(this.data);
						data = aes.encrypt(data, this.password);

						storage.store(this.username, data);
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

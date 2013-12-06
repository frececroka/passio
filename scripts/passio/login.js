(function () {

	define([
		'underscore',
		'angular',
		'crypto/aes'
	], function (_, angular, aes) {

		var login = angular.module('login', []);

		login.controller('LoginController', [
			'$scope',
			'$location',
			'passwordService',
			function ($scope, $location, passwordService) {
				$scope.doLogin = function () {
					if (passwordService.setup($scope.user.name, $scope.user.password)) {
						$location.path('/').replace();
					} else {
						$scope.user.password = '';
						$scope.loginFailed = true;
					}
				};

			}
		]);

		login.factory('passwordService', function () {
			return {
				setup: function (username, password) {
					this.username = username;
					this.password = password;

					var data = localStorage.getItem(username);
					if (!data) {
						this.passwordData = [];
						this.updateUpstream();
					} else {
						try {
							data = aes.decrypt(data, this.password);
						} catch (e) {
							return false;
						}

						this.passwordData = JSON.parse(data);
					}

					return true;
				},

				tearDown: function() {
					this.passwordData = undefined;
				},

				isInitialized: function () {
					return !!this.passwordData;
				},

				put: function (entry) {
					entry = _.extend({
						'description': '',
						'url': '',
						'username': '',
						'password': this.generatePassword()
					}, entry || {});

					entry = _.pick(entry, 'description', 'url', 'username', 'password');

					entry.created = new Date().getTime();
					entry.modified = entry.created;

					this.passwordData.push(entry);
					this.updateUpstream();
				},

				get: function () {
					var clonedData = [];

					_.each(this.passwordData, function (d) {
						clonedData.push(_.clone(d));
					});

					return clonedData;
				},

				updateUpstream: function () {
					var data = JSON.stringify(this.passwordData);
					data = aes.encrypt(data, this.password);

					localStorage.setItem(this.username, data);
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
		});

	});

})();

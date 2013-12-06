(function () {

	define([
		'angular'
	], function (angular) {

		var localstorage = angular.module('localstorage', []);

		localstorage.factory('localStorageService', function () {
			return {
				store: function (key, value) {
					localStorage.setItem(key, value);
				},

				retrieve: function (key) {
					return localStorage.getItem(key);
				}
			};
		});

	});

})();

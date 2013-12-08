(function () {
	'use strict';

	define([
		'angular'
	], function (angular) {

		var rest = angular.module('passio.rest', []);

		rest.factory('restService', [
			'$http',
			function ($http) {
				return {
					store: function (auth, key, value) {
						return $http({
							method: 'POST',
							url: 'https://passio-backend.appspot.com/' + key,
							data: value,
							headers: {
								'Authorization': auth,
								'Content-Type': 'text/plain'
							}
						});
					},

					retrieve: function (key) {
						return $http({
							method: 'GET',
							url: 'https://passio-backend.appspot.com/' + key,
							headers: {
								'Accept': 'text/plain'
							}
						}).then(function (d) {
							return d.data;
						});
					}
				};
			}
		]);

	});

})();

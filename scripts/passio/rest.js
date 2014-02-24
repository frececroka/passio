(function () {
	'use strict';

	define([
		'angular',
		'passio/config'
	], function (angular) {

		var rest = angular.module('passio.rest', ['passio.config']);

		rest.factory('restService', [
			'$http',
			'config',
			function ($http, conf) {
				return {
					store: function (auth, key, value) {
						return $http({
							method: 'POST',
							url: conf.backendUrl + key,
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
							url: conf.backendUrl + key,
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

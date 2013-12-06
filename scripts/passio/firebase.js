(function () {

	define([
		'angular',
		'firebase'
	], function (angular) {

		var firebase = angular.module('firebase', []);

		firebase.factory('firebaseService', [
			'$q',
			function ($q) {
				var storage = new Firebase('https://passio.firebaseio.com/');

				return {
					store: function (key, value) {
						storage.child(key).set(value);
					},

					retrieve: function (key, callback) {
						var promise = $q.defer();

						storage.child(key).once('value', function (d) {
							promise.resolve(d.val());
						});

						return promise.promise;
					}
				};
			}
		]);

	});

})();

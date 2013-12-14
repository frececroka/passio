(function () {
	'use strict';

	define([
		'angular'
	], function (angular) {
		angular.module('passio.mocks.base', []).factory('$exceptionHandler', function () {
			// The default definition of the $exceptionHandler logs the exception. However, the test
			// reporter already logs the exception. (The exception rejects the promise and then the done()
			// callback of the test is called with the exception.)
			return function () {};
		});
	});
}());

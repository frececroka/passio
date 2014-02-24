(function () {
	'use strict';

	define([
		'angular',
		'text!passio.json'
	], function (angular, config) {
		var passioConfig = angular.module('passio.config', []);
		passioConfig.value('config', JSON.parse(config));
	});

})();

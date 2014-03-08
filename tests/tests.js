(function () {
	'use strict';

	requirejs.config({
		baseUrl: '/base/scripts'
	});

	require([
		'specs/core',
		'specs/encryption'
	], window.__karma__.start);
}());

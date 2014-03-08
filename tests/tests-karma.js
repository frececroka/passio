(function () {
	'use strict';

	requirejs.config({
		baseUrl: '/base/scripts'
	});

	require(['tests'], window.__karma__.start);
}());

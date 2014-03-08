(function () {
	'use strict';

	requirejs.config({
		baseUrl: '/scripts'
	});

	require([
		'mocha'
	], function (mocha) {
		mocha.setup('bdd');

		require(['tests'], function () {
			mocha.run();
			mocha.checkLeaks();
		});
	});
}());

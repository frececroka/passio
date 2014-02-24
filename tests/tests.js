(function () {
	'use strict';

	requirejs.config({
		baseUrl: '../scripts'
	});

	require([
		'mocha'
	], function (mocha) {
		mocha.setup({
			ui: 'bdd',
			globals: [
				'Worker'
			]
		});

		require([
			'specs/core',
			'specs/encryption'
		], function () {
			mocha.checkLeaks();
			mocha.run();
		});
	});
}());

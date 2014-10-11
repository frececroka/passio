requirejs.config({
	baseUrl: 'scripts',
	paths: {
		'underscore': 'vendor/underscore',
		'angular': 'vendor/angular',
		'angular-route': 'vendor/angular-route',
		'jquery': 'vendor/jquery',
		'crypto': 'vendor/crypto',
		'chai': 'vendor/chai',
		'sinon': 'vendor/sinon',
		'mocha': 'vendor/mocha',
		'tests': '../tests/tests',
		'specs': '../tests/specs',
		'mocks': '../tests/mocks',
		'text': 'vendor/require/text'
	},
	shim: {
		'underscore': {
			exports: '_'
		},
		'angular': {
			exports: 'angular',
			deps: ['jquery']
		},
		'angular-route': {
			exports: null,
			deps: ['angular']
		},
		'crypto': {
			exports: 'CryptoJS'
		},
		'crypto/cipher-core': {
			exports: 'CryptoJS.lib.Cipher',
			deps: ['crypto', 'crypto/base64', 'crypto/evpkdf']
		},
		'crypto/base64': {
			exports: 'CryptoJS.enc.Base64',
			deps: ['crypto']
		},
		'crypto/evpkdf': {
			exports: 'CryptoJS.algo.EvpKDF',
			deps: ['crypto', 'crypto/md5']
		},
		'crypto/pbkdf2': {
			exports: 'CryptoJS.PBKDF2',
			deps: ['crypto', 'crypto/sha1', 'crypto/hmac']
		},
		'crypto/sha1': {
			exports: 'CryptoJS.algo.SHA1',
			deps: ['crypto']
		},
		'crypto/md5': {
			exports: 'CryptoJS.algo.MD5',
			deps: ['crypto']
		},
		'crypto/aes': {
			exports: 'CryptoJS.AES',
			deps: ['crypto', 'crypto/cipher-core']
		},
		'crypto/hmac': {
			deps: ['crypto']
		},
		'mocha': {
			exports: 'mocha'
		},
		'sinon': {
			exports: 'sinon'
		}
	}
});

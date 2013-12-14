(function () {
	'use strict';

	define([
		'crypto/base64'
	], function (angular) {
		return {
			stringify: function (cipherParams) {
				// create json object with ciphertext
				var jsonObj = {
					ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64)
				};

				// optionally add iv and salt
				if (cipherParams.iv) {
					jsonObj.iv = cipherParams.iv.toString(CryptoJS.enc.Base64);
				}

				if (cipherParams.salt) {
					jsonObj.s = cipherParams.salt.toString(CryptoJS.enc.Base64);
				}

				// stringify json object
				return JSON.stringify(jsonObj);
			},

			parse: function (jsonStr) {
				// parse json string
				var jsonObj = JSON.parse(jsonStr);

				// extract ciphertext from json object, and create cipher params object
				var cipherParams = CryptoJS.lib.CipherParams.create({
					ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct)
				});

				// optionally extract iv and salt
				if (jsonObj.iv) {
					cipherParams.iv = CryptoJS.enc.Base64.parse(jsonObj.iv)
				}

				if (jsonObj.s) {
					cipherParams.salt = CryptoJS.enc.Base64.parse(jsonObj.s)
				}

				return cipherParams;
			}
		};
	});

}());

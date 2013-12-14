importScripts(
	"../vendor/crypto.js",
	"../vendor/crypto/sha1.js",
	"../vendor/crypto/hmac.js",
	"../vendor/crypto/pbkdf2.js"
);

onmessage = function (msg) {
	var d = msg.data;

	var auth = CryptoJS.PBKDF2(d.password, CryptoJS.SHA1(d.password), {
		keySize: d.length / 32,
		iterations: d.iterations
	});

	postMessage(auth.toString());
};

// we have to define the window object manually, as crypto.js either needs a window object or the
// node.js require() function. we don't have a require function, so we allow crypto.js to write
// everything on this empty window object.
var window = {};

importScripts(
	"../vendor/crypto.js",
	"../vendor/crypto/hmac.js",
	"../vendor/crypto/sha1.js",
	"../vendor/crypto/sha256.js",
	"../vendor/crypto/pbkdf2.js"
);

onmessage = function (msg) {
	var auth = window.Crypto.PBKDF2(msg.data.password, window.Crypto.SHA256(msg.data.password), 512, {
		iterations: msg.data.authIterations
	});

	auth = window.Crypto.SHA256(auth);

	postMessage(auth);
};

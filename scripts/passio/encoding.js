(function () {
	define(function () {
		return {
			ab2str: function ab2str (ab) {
				var str, uint8, i;

				str = '';
				uint8 = new Uint8Array(ab);
				for (i = 0; i < uint8.length; i++) {
					str += String.fromCharCode(uint8[i]);
				}

				return str;
			},

			str2ab: function str2ab (str) {
				var ab, uint8, i;

				ab = new ArrayBuffer(str.length);
				uint8 = new Uint8Array(ab);
				for (i = 0; i < str.length; i++) {
					uint8[i] = str.charCodeAt(i);
				}

				return ab;
			},

			ab2b64: function ab2b64 (ab) {
				var str, uint8;

				str = '';
				uint8 = new Uint8Array(ab);
				for (var i = 0; i < uint8.length; i++) {
					str += String.fromCharCode(uint8[i]);
				}
				return btoa(str);
			},

			b642ab: function b642ab (b64) {
				var str, ab, uint8, i;

				str = atob(b64);
				ab = new ArrayBuffer(str.length);
				uint8 = new Uint8Array(ab);
				for (i = 0; i < str.length; i++) {
					uint8[i] = str.charCodeAt(i);
				}
				return ab;
			},

			wa2ab: function wa2ab (wa) {
				var ab, uint32, uint8, i, tmp;

				ab = new ArrayBuffer(wa.sigBytes);
				uint32 = new Uint32Array(ab);

				for (i = 0; i < wa.words.length; i++) {
					uint32[wa.words.length-i-1] = wa.words[i];
				}

				uint8 = new Uint8Array(ab);

				for (i = 0; i < uint8.length/2; i++) {
					tmp = uint8[i];
					uint8[i] = uint8[uint8.length-i-1];
					uint8[uint8.length-i-1] = tmp;
				}

				return ab;
			}
		};
	});
}());

(function () {
	define(function () {
		return {
			ab2str: function ab2str (ab) {
				var str, utf8, i, firstByte, nextByte, codepoint, codepointLen, j;

				str = '';
				utf8 = new Uint8Array(ab);
				for (i = 0; i < utf8.length; i += codepointLen) {
					firstByte = utf8[i];

					if (firstByte <= 0b01111111)
						codepointLen = 1;
					else if (0b11000000 <= firstByte && firstByte <= 0b11011111)
						codepointLen = 2;
					else if (0b11100000 <= firstByte && firstByte <= 0b11101111)
						codepointLen = 3;
					else if (0b11110000 <= firstByte && firstByte <= 0b11110111)
						codepointLen = 4;
					else if (0b11111000 <= firstByte && firstByte <= 0b11111011)
						codepointLen = 5;
					else if (0b11111100 <= firstByte && firstByte <= 0b11111101)
						codepointLen = 6;
					else
						throw new RangeError('Invalid byte ' + firstByte);

					if (codepointLen === 1)
						codepoint = firstByte;
					else
						codepoint = firstByte & (0b11111111 >> codepointLen+1);

					for (j = 1; j < codepointLen; j++) {
						nextByte = utf8[i+j];
						if ((nextByte & 0b11000000) !== 0b10000000) {
							throw new RangeError('Invalid byte ' + nextByte);
						}

						codepoint = (codepoint << 6) + (nextByte & 0b00111111);
					}

					str += String.fromCharCode(codepoint);
				}

				return str;
			},

			str2ab: function str2ab (str) {
				var ab, utf8, utf8Idx, i, codepoint, firstBytePrefix;

				ab = new ArrayBuffer(str.length * 6);
				utf8 = new Uint8Array(ab);
				utf8Idx = 0;

				for (i = 0; i < str.length; i++) {
					codepoint = str.charCodeAt(i);
					if (codepoint <= 0b01111111) {
						furtherBytes = 0;
					} else if (0x00000080 <= codepoint && codepoint <= 0x000007FF) {
						furtherBytes = 1;
						firstBytePrefix = 0b11000000;
					} else if (0x00000800 <= codepoint && codepoint <= 0x0000FFFF) {
						furtherBytes = 2;
						firstBytePrefix = 0b11100000;
					} else if (0x00010000 <= codepoint && codepoint <= 0x0001FFFF) {
						furtherBytes = 3;
						firstBytePrefix = 0b11110000;
					} else if (0x00200000 <= codepoint && codepoint <= 0x03FFFFFF) {
						furtherBytes = 4;
						firstBytePrefix = 0b11111000;
					} else if (0x04000000 <= codepoint && codepoint <= 0x7FFFFFFF) {
						furtherBytes = 5;
						firstBytePrefix = 0b11111100;
					}

					if (furtherBytes === 0) {
						utf8[utf8Idx++] = codepoint;
					} else {
						utf8[utf8Idx++] = firstBytePrefix | (codepoint >> furtherBytes*6);
						while (furtherBytes > 0) {
							utf8[utf8Idx++] = 0b10000000 | ((codepoint >> (furtherBytes-1)*6) & 0b00111111);
							furtherBytes--;
						}
					}
				}

				return ab.slice(0, utf8Idx);
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

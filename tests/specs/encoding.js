(function () {
	'use strict';

	define([
		'chai',
		'passio/encoding',
	], function (chai, encoding) {
		var assert = chai.assert;

		describe('encoding', function () {

			describe('ab2str', function () {

				it('should be able to decode pure ASCII', function () {
					var ascii = new Uint8Array([
						104, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 33
					]);

					var str = encoding.ab2str(ascii);
					assert.strictEqual('hello, world!', str);
				});

				it('should work with 2-byte codepoints', function () {
					var utf8 = new Uint8Array([
						194, 181, 45, 114, 196, 149, 196, 140, 117, 114, 115, 105, 118, 101,
						32, 102, 117, 110, 99, 116, 105, 111, 110, 115, 58, 32, 223, 182
					]);

					var str = encoding.ab2str(utf8);
					assert.strictEqual('\u00b5-r\u0115\u010cursive functions: \u07F6', str);
				});

				it('should work with 3-byte codepoints', function () {
					var utf8 = new Uint8Array([
						226, 178, 144, 32, 97, 110, 100, 32, 226, 178, 150, 32, 97,
						110, 100, 32, 226, 179, 128
					]);

					var str = encoding.ab2str(utf8);
					assert.strictEqual('\u2C90 and \u2C96 and \u2CC0', str);
				});

				it('should work with 4-byte codepoints', function () {
					var utf8 = new Uint8Array([
						104, 111, 114, 115, 101, 32, 40, 225, 128, 136, 53, 41, 32, 97,
						110, 100, 32, 100, 101, 101, 114, 40, 225, 128, 136, 50, 41
					]);

					var str = encoding.ab2str(utf8);
					assert.strictEqual('horse (\u10085) and deer(\u10082)', str);
				});

				it('should recognize bad first bytes', function () {
					var badUtf = new Uint8Array([0b11111110, 111, 114, 115]);
					assert.throws(function () {
						encoding.ab2str(badUtf);
					});
				});

				it('should recognize bad bytes', function () {
					var badUtf = new Uint8Array([
						0b11100100,
						0b01111001,
						0b10101101
					]);

					assert.throws(function () {
						encoding.ab2str(badUtf);
					});
				});

				it('should recognize bad codepoint lengths', function () {
					var badUtf = new Uint8Array([
						0b11101100,    // First byte wants two more bytes
						0b10111000,    // but gets only one byte.
						0b11011100
					]);

					assert.throws(function () {
						encoding.ab2str(badUtf);
					});
				});

				it('should recognize premature end of byte sequence', function () {
					var badUtf = new Uint8Array([
						0b11101100,    // First byte wants two more bytes
						0b10111000     // but gets only one byte.
					]);

					assert.throws(function () {
						encoding.ab2str(badUtf);
					});
				});

			});

			describe('str2ab', function () {

				it('should work with pure ASCII', function () {
					assert.deepEqual(
						new Uint8Array([104, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100]),
						new Uint8Array(encoding.str2ab('hello, world'))
					);
				});

				it('should work with codepoints up to U+07FF', function () {
					var utf8 = new Uint8Array([
						194, 181, 44, 32, 196, 149, 32, 97, 110, 100, 32, 196, 140, 32, 97, 110, 100, 32, 223, 182
					]);

					assert.deepEqual(utf8, new Uint8Array(
							encoding.str2ab('\u00b5, \u0115 and \u010c and \u07F6')));
				});

				it('should work with codepoints up to U+FFFF', function () {
					var utf8 = new Uint8Array([
						224, 160, 128, 44, 32, 234, 175, 141, 32, 97, 110, 100, 32, 239, 128, 128, 32, 97, 110,
						100, 32, 239, 191, 191
					]);

					assert.deepEqual(utf8, new Uint8Array(
							encoding.str2ab('\u0800, \uabcd and \uf000 and \uffff')));
				});

			});

		});
	})
}());

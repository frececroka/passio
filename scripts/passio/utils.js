(function () {
	'use strict';

	define([
		'angular'
	], function (angular) {
		var utils = angular.module('passio.utils', []);

		utils.factory('utils', [
			function () {
				return {
					/**
					 * Perform a fuzzy match on the given haystack, matching the given needle.
					 *
					 * An object with the properties `rank` and `slices` is returned. The rank is a positive
					 * integer (If the needle was found) or `0` (If the needle was not found). A lower rank is
					 * better.
					 *
					 * The property slices is an array indicating which parts of the haystack matched the
					 * needle.
					 *
					 * If the haystack is `The path of the righteous man is beset on all sides...` and the
					 * needle is `rigisbset`, the following slices will be returned:
					 *
					 *     { slice: 'The path of the ', match: false },
					 *     { slice: 'rig', match: true },
					 *     { slice: 'hteous man ', match: false },
					 *     { slice: 'is', match: true },
					 *     { slice: ' ', match: false },
					 *     { slice: 'b', match: true },
					 *     { slice: 'e', match: false },
					 *     { slice: 'set', match: true },
					 *     { slice: ' on all sides...', match: false }
					 *
					 * @param  {String} haystack  The string to search in.
					 * @param  {String} needle  The string to search for.
					 *
					 * @return {Object}  An object indicating if and how the haystack matched the needle.
					 */
					fuzzyMatch: function (haystack, needle) {
						var originalHaystack, regex, match;

						originalHaystack = haystack;

						haystack = String(haystack).toLowerCase();
						needle = String(needle).toLowerCase();

						var haystackOffset, haystackIndex, needleIndex, haystackCharacter, needleCharacter,
							characterMatch, currentMatch, firstSlice, lastSlice;
						for (haystackOffset = 0; haystackOffset <= haystack.length - needle.length; haystackOffset += 1) {
							characterMatch = [];

							for (haystackIndex = 0; haystackIndex < haystackOffset; haystackIndex += 1) {
								characterMatch.push({
									charcter: originalHaystack[haystackIndex],
									match: false
								});
							}

							haystackIndex = haystackOffset;
							needleIndex = 0;
							while (haystackIndex < haystack.length && needleIndex < needle.length) {
								haystackCharacter = haystack[haystackIndex];
								needleCharacter = needle[needleIndex];

								characterMatch.push({
									charcter: originalHaystack[haystackIndex],
									match: haystackCharacter === needleCharacter
								});

								haystackIndex += 1;
								if (haystackCharacter === needleCharacter) {
									needleIndex += 1;
								}
							}

							// The needle was not completely matched.
							if (needleIndex < needle.length) continue;

							// Push the rest of the haystack
							for (; haystackIndex < haystack.length; haystackIndex += 1) {
								characterMatch.push({
									charcter: originalHaystack[haystackIndex],
									match: false
								});
							}

							currentMatch = _.reduce(characterMatch, function (memo, c) {
								var currentSlice = memo.slices[memo.slices.length - 1];

								if (c.match === currentSlice.match) {
									currentSlice.slice += c.charcter;
								} else {
									memo.slices.push({
										slice: c.charcter,
										match: c.match
									});
								}

								return memo;
							}, {
								slices: [{
									slice: '',
									match: characterMatch[0].match
								}]
							});

							if (currentMatch.slices.length === 1) {
								currentMatch.rank = haystack.length;
							} else {
								currentMatch.rank = haystack.length;

								firstSlice = currentMatch.slices[0];
								lastSlice = currentMatch.slices[currentMatch.slices.length - 1];

								if (!firstSlice.match) {
									currentMatch.rank -= firstSlice.slice.length;
								}

								if (!lastSlice.match) {
									currentMatch.rank -= lastSlice.slice.length;
								}
							}

							match = !match || match.rank > currentMatch.rank ?
								currentMatch : match;
						}

						return match || {
							rank: 0,
							slices: [{
								slice: originalHaystack,
								match: false
							}]
						};
					}
				};
			}
		]);
	});

}());

(function () {
	'use strict';

	define([
		'angular'
	], function (angular) {
		var utils = angular.module('passio.utils', []);

		utils.factory('utils', [
			function () {
				return {
					fuzzyMatch: function (haystack, needle) {
						var regex, match;

						haystack = String(haystack).toLowerCase();
						needle = String(needle).toLowerCase();

						// Create a RegEx for fuzzy-matching. If the needle is "abcde", the regex will be
						// "a.*?b.*?c.*?d". We do not want to match greedily, hence the questionmark.
						regex = new RegExp(needle.split('').join('.*?'));
						match = regex.exec(haystack);

						if (!match) {
							// Returning 0 if no match was found, which is the worst possible rank.
							return 0;
						}

						// Returning the length of the match otherwise. Possible ranks (from best to worst)
						// are 1, 2, 3, 4, ..., 0.
						return match[0].length;
					}
				};
			}
		]);
	});

}());

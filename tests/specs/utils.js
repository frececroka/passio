(function () {
	'use strict';

	define([
		'chai',
		'angular',
		'passio/utils'
	], function (chai, angular) {
		var assert = chai.assert;

		describe('utils', function () {
			var $injector, utils;

			beforeEach(function () {
				$injector = angular.injector([
					'ng',
					'passio.utils'
				]);

				utils = $injector.get('utils');
			});

			describe('fuzzy match', function () {
				it('should create the right slices when the match starts somewhere in the middle', function () {
					var haystack, needle, match;

					haystack = 'The path of the righteous man is beset on all sides...';
					needle = 'rigisbset';

					match = utils.fuzzyMatch(haystack, needle);

					assert.strictEqual(
						match.rank, 22,
						'The match contains the correct ranking'
					);

					assert.deepEqual(
						match.slices, [
							{ slice: 'The path of the ', match: false },
							{ slice: 'rig', match: true },
							{ slice: 'hteous man ', match: false },
							{ slice: 'is', match: true },
							{ slice: ' ', match: false },
							{ slice: 'b', match: true },
							{ slice: 'e', match: false },
							{ slice: 'set', match: true },
							{ slice: ' on all sides...', match: false }
						], 'The match contains the correct slices'
					);
				});

				it('should create the right slices when the match starts with the first character', function () {
					var haystack, needle, match;

					haystack = 'The path of the righteous man is beset on all sides...';
					needle = 'thepathrightman';

					match = utils.fuzzyMatch(haystack, needle);

					assert.strictEqual(
						match.rank, 29,
						'The match contains the correct ranking'
					);

					assert.deepEqual(
						match.slices, [
							{ slice: 'The', match: true },
							{ slice: ' ', match: false },
							{ slice: 'path', match: true },
							{ slice: ' of the ', match: false },
							{ slice: 'right', match: true },
							{ slice: 'eous ', match: false },
							{ slice: 'man', match: true },
							{ slice: ' is beset on all sides...', match: false }
						], 'The match contains the correct slices'
					);
				});

				it('should match a string if the needle equals the haystack', function () {
					assert.strictEqual(
						6, utils.fuzzyMatch('GitHub', 'github').rank,
						'Searching for "github" in "GitHub" succeeds'
					);
				});

				it('should return match the shortest match, not the first match', function () {
					var haystack, needle, match;

					haystack = 'username+newrelic@gmail.com';
					needle = 'nrelic';

					match = utils.fuzzyMatch(haystack, needle);

					assert.strictEqual(
						match.rank, 8,
						'The match contains the correct ranking'
					);

					assert.deepEqual(
						match.slices, [
							{ slice: 'username+', match: false },
							{ slice: 'n', match: true },
							{ slice: 'ew', match: false },
							{ slice: 'relic', match: true },
							{ slice: '@gmail.com', match: false }
						], 'The match contains the correct slices'
					);
				});

				it('should return an array of slices, even if there is only one slice which did not match', function () {
					assert.deepEqual(
						utils.fuzzyMatch('sublime_text', 'is_pretty_cool').slices, [
							{ slice: 'sublime_text', match: false }
						]
					);
				});
			});
		});
	});
}());

module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: {
			pre: ['dist'],
			postDist: ['dist/scripts/vendor']
		},
		sass: {
			dev: {
				files: {
					'dist/styles/main.css': 'styles/style.scss'
				}
			},
			dist: {
				files: '<%= sass.dev.files &>',
				options: {
					style: 'compressed'
				}
			}
		},
		cssmin: {
			vendor: {
				files: {
					'dist/styles/vendor.css': [
						'bower_components/bootstrap/dist/css/bootstrap.css'
					],
					'dist/styles/tests.css': [
						'bower_components/mocha/mocha.css'
					]
				}
			}
		},
		copy: {
			dev: {
				files: [
					{ src: ['bower_components/underscore/underscore.js'], dest: 'dist/scripts/vendor/underscore.js' },
					{ src: ['bower_components/requirejs/require.js'], dest: 'dist/scripts/vendor/require.js' },
					{ src: ['bower_components/requirejs-text/text.js'], dest: 'dist/scripts/vendor/require/text.js' },
					{ src: ['bower_components/jquery/jquery.js'], dest: 'dist/scripts/vendor/jquery.js' },
					{ src: ['bower_components/angular/angular.js'], dest: 'dist/scripts/vendor/angular.js' },
					{ src: ['bower_components/angular-route/angular-route.js'], dest: 'dist/scripts/vendor/angular-route.js' },
					{ src: ['bower_components/cryptojs/lib/Crypto.js'], dest: 'dist/scripts/vendor/crypto.js' },
					{ src: ['bower_components/cryptojs/lib/AES.js'], dest: 'dist/scripts/vendor/crypto/aes.js' },
					{ src: ['bower_components/cryptojs/lib/BlockModes.js'], dest: 'dist/scripts/vendor/crypto/block-modes.js' },
					{ src: ['bower_components/cryptojs/lib/PBKDF2.js'], dest: 'dist/scripts/vendor/crypto/pbkdf2.js' },
					{ src: ['bower_components/cryptojs/lib/HMAC.js'], dest: 'dist/scripts/vendor/crypto/hmac.js' },
					{ src: ['bower_components/cryptojs/lib/SHA1.js'], dest: 'dist/scripts/vendor/crypto/sha1.js' },
					{ src: ['bower_components/cryptojs/lib/SHA256.js'], dest: 'dist/scripts/vendor/crypto/sha256.js' },
					{ src: ['bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.woff'], dest: 'dist/fonts/glyphicons-halflings-regular.woff' },
					{ src: ['bower_components/mocha/mocha.js'], dest: 'dist/scripts/vendor/mocha.js' },
					{ src: ['bower_components/assert/assert.js'], dest: 'dist/scripts/vendor/assert.js' },
					{ src: ['bower_components/worker-mock/worker-mock.js'], dest: 'dist/scripts/vendor/worker-mock.js' },
					{
						src: [
							'scripts/**',
							'views/**',
							'tests/**',
							'index.html'
						],
						dest: 'dist/'
					},
					{ src: ['passio.json'], dest: 'dist/scripts/passio.json' }
				]
			}
		},
		watch: {
			dev: {
				files: [
					'scripts/**',
					'styles/**',
					'views/**',
					'tests/**',
					'index.html'
				],
				tasks: ['dev']
			}
		},
		connect: {
			dist: {
				options: {
					base: 'dist'
				}
			}
		}
	});

	grunt.registerTask('dev', ['clean:pre', 'sass:dev', 'copy:dev', 'cssmin:vendor']);
	grunt.registerTask('server', ['dev', 'connect', 'watch']);

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-connect');

};

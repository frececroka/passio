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
					{ src: ['bower_components/jquery/dist/jquery.js'], dest: 'dist/scripts/vendor/jquery.js' },
					{ src: ['bower_components/angular/angular.js'], dest: 'dist/scripts/vendor/angular.js' },
					{ src: ['bower_components/angular-route/angular-route.js'], dest: 'dist/scripts/vendor/angular-route.js' },
					{ src: ['bower_components/cryptojs/components/core.js'], dest: 'dist/scripts/vendor/crypto.js' },
					{ src: ['bower_components/cryptojs/components/cipher-core.js'], dest: 'dist/scripts/vendor/crypto/cipher-core.js' },
					{ src: ['bower_components/cryptojs/components/aes.js'], dest: 'dist/scripts/vendor/crypto/aes.js' },
					{ src: ['bower_components/cryptojs/components/hmac.js'], dest: 'dist/scripts/vendor/crypto/hmac.js' },
					{ src: ['bower_components/cryptojs/components/sha1.js'], dest: 'dist/scripts/vendor/crypto/sha1.js' },
					{ src: ['bower_components/cryptojs/components/sha256.js'], dest: 'dist/scripts/vendor/crypto/sha256.js' },
					{ src: ['bower_components/cryptojs/components/pbkdf2.js'], dest: 'dist/scripts/vendor/crypto/pbkdf2.js' },
					{ src: ['bower_components/cryptojs/components/enc-base64.js'], dest: 'dist/scripts/vendor/crypto/base64.js' },
					{ src: ['bower_components/cryptojs/components/evpkdf.js'], dest: 'dist/scripts/vendor/crypto/evpkdf.js' },
					{ src: ['bower_components/cryptojs/components/md5.js'], dest: 'dist/scripts/vendor/crypto/md5.js' },
					{ src: ['bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.woff'], dest: 'dist/fonts/glyphicons-halflings-regular.woff' },
					{ src: ['bower_components/mocha/mocha.js'], dest: 'dist/scripts/vendor/mocha.js' },
					{ src: ['bower_components/chai/chai.js'], dest: 'dist/scripts/vendor/chai.js' },
					{ src: ['bower_components/sinon/index.js'], dest: 'dist/scripts/vendor/sinon.js' },
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
		karma: {
			options: {
				basePath: 'dist',
				frameworks: ['mocha', 'requirejs'],
				reporters: ['dots'],
				autoWatch: false,
				files: [
					'scripts/require-config.js',
					'tests/tests-karma.js',
					{ pattern: 'scripts/vendor/*.js', included: false },
					{ pattern: 'scripts/vendor/**/*.js', included: false },
					{ pattern: 'scripts/*.js', included: false },
					{ pattern: 'scripts/**/*.js', included: false },
					{ pattern: 'tests/**/*.js', included: false }
				],
				browsers: ['Firefox']
			},
			dev: {
				background: true
			},
			ci: {
				singleRun: true
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
				tasks: ['dev', 'karma:dev:run']
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
	grunt.registerTask('server', ['dev', 'connect', 'karma:dev', 'watch']);

	grunt.registerTask('test', ['karma:ci']);

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-karma');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-connect');

};

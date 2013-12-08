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
					]
				}
			}
		},
		copy: {
			dev: {
				files: [
					{ src: ['bower_components/underscore/underscore.js'], dest: 'dist/scripts/vendor/underscore.js' },
					{ src: ['bower_components/requirejs/require.js'], dest: 'dist/scripts/vendor/require.js' },
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
					{
						src: [
							'scripts/**',
							'views/**',
							'index.html'
						],
						dest: 'dist/'
					}
				]
			}
		},
		watch: {
			copy: {
				files: [
					'scripts/**',
					'views/**',
					'index.html'
				],
				tasks: ['dev']
			},
			styles: {
				files: [
					'styles/**'
				],
				tasks: ['sass:dev']
			}
		}
	});

	grunt.registerTask('dev', ['clean:pre', 'sass:dev', 'copy:dev', 'cssmin:vendor']);

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');

};

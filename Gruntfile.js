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
				files: [{
					src: [
						'scripts/**',
						'views/**',
						'index.html'
					],
					dest: 'dist/'
				}]
			}
		},
		uglify: {
			vendor: {
				files: {
					'dist/scripts/vendor.js': [
						'bower_components/requirejs/require.js',
						'bower_components/jquery/jquery.js',
						'bower_components/angular/angular.js',
						'bower_components/angular-route/angular-route.js',
					]
				}
			},
			main: {
				files: {
					'dist/scripts/main.js': [
						'scripts/main.js'
					]
				}
			}
		},
		watch: {
			copy: {
				files: [
					'scripts/**',
					'views/**',
					'index.html'
				],
				tasks: ['copy:dev']
			},
			styles: {
				files: [
					'styles/**'
				],
				tasks: ['sass:dev']
			}
		}
	});

	grunt.registerTask('dev', ['clean:pre', 'sass:dev', 'copy:dev', 'cssmin:vendor', 'uglify:vendor']);
	grunt.registerTask('@watch', ['dev', 'watch']);

	grunt.registerTask('dist', ['clean:pre', 'sass:dist', 'uglify:main', 'uglify:vendor']);

	grunt.registerTask('default', ['@watch']);

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');

};

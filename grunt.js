module.exports = function(grunt) {

  
  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    docco: {
        app: {
            src: ['lib/*.js']
        }
    },
    lint: {
      files: ['grunt.js', 'lib/**/*.js']
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        browser: true,
        predef: ['module', 'require', 'console', 'exports']
      },
      gruntfile: {
        src: 'grunt.js'
      },
      lib_test: {
        src: ['lib/**/*.js']
      }
    }    
  });

  // Default task.
  grunt.registerTask('default', 'lint docco');
  grunt.registerTask('prepare', 'default bump');

  grunt.loadNpmTasks('grunt-docco');
  grunt.loadNpmTasks('grunt-bump');
};

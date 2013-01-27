module.exports = function(grunt) {

  
  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    jasmine_node: {
        projectRoot: "./spec",
        forceExit: false,
        extensions: 'coffee',
        jUnit: {
            report: false,
            savePath : "./build/reports/jasmine/",
            useDotNotation: true,
            consolidate: true
        }
    },
    docco: {
        app: {
            src: ['lib/*.js']
        }
    },
    watch: {
      files: ['lib/**/*.js','spec/**/*.coffee'],
      tasks: 'default'
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
  grunt.registerTask('default', 'lint jasmine_node docco');
  grunt.registerTask('prepare', 'default bump');

  grunt.loadNpmTasks('grunt-jasmine-node');
  grunt.loadNpmTasks('grunt-docco');
  grunt.loadNpmTasks('grunt-bump');
};

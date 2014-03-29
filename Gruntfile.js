module.exports = function (grunt) {
  "use strict";
  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    jasmine_node: {
      all: ["./spec"],
      options: {
        forceExit: false,
        extensions: 'coffee',
        jUnit: {
          report: false,
          savePath : "./build/reports/jasmine/",
          useDotNotation: true,
          consolidate: true
        }
      }
    },
    docco: {
      app: {
        src: ['lib/*.js']
      }
    },
    watch: {
      files: ['lib/**/*.js', 'spec/**/*.coffee'],
      tasks: 'default'
    },
    jslint: {
      client: {
        src: ['./Gruntfile.js', 'lib/**/*.js'],
        directives: {
          indent: 2,
          curly: true,
          eqeqeq: true,
          eqnull: true,
          immed: true,
          latedef: true,
          newcap: true,
          noarg: true,
          sub: true,
          undef: true,
          unused: true,
          boss: true,
          browser: true,
          predef: ['module', 'require', 'console', 'exports']
        }
      }
    }
  });

  // Default task.
  grunt.registerTask('default', ['jslint', 'jasmine_node', 'docco']);
  grunt.registerTask('prepare', 'default bump');
  grunt.registerTask('test', 'jasmine_node');

  grunt.loadNpmTasks('grunt-jasmine-node');
  grunt.loadNpmTasks('grunt-docco');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-jslint');
};

module.exports = function(grunt) {

  
  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    docco: {
        app: {
            src: ['lib/*.js']
        }
    }
    
  });

  // Default task.
  grunt.registerTask('default', 'docco');
  grunt.registerTask('prepare', 'docco bump');

  grunt.loadNpmTasks('grunt-docco');
  grunt.loadNpmTasks('grunt-bump');
};

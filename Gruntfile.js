/* Grunt Tasks  */
module.exports = function(grunt){
    grunt.initConfig({
      // basic setting
      pkg: grunt.file.readJSON('package.json'),

      // check JS code
      jshint: {
        files: ['Gruntfile.js', 'public/js/*.js'],
        options: {
            globals: {
            jQuery: true,
          },
        },
      },
        
      // minify css files
      cssmin:{
        combine: {
          files: {
            'public/css/index.min.css': ['public/css/index.css'],
            'public/css/watcher.min.css': ['public/css/watcher.css'],
            'public/css/broadcast.min.css': ['public/css/broadcast.css']
          },
        },
      },

      // minify js
      uglify:{
        options: {
          banner: '\/\*\! \<\%\= pkg.name \%\> \<\%\= grunt.template.today\(\"dd-mm-yyyy\"\) \%\> \*\/',
          report: 'min',
          mangle: false
        },
        combine: {
          files: {
            'public/js/adapter.min.js': ['public/js/adapter.js'],
            'public/js/rtcClient.min.js': ['public/js/rtcClient.js'],
            'public/js/rtcRecorder.min.js': ['public/js/rtcRecorder.js'],
            'public/js/index.min.js': ['public/js/index.js'],
            'public/js/watcher.min.js': ['public/js/watcher.js'],
            'public/js/broadcast.min.js': ['public/js/broadcast.js']
          },
        },
      },

      // minify html
      htmlmin: {
        dist: {
          options: {
            removeComments: true,
            collapseWhitespace: true
          },
          files: {
            'public/my_ng_templates/my_ng_index.html': 'public/my_ng_templates/my_ng_index.htm',
            'public/my_ng_templates/my_ng_watcher.html': 'public/my_ng_templates/my_ng_watcher.htm',
            'public/my_ng_templates/my_ng_broadcast.html': 'public/my_ng_templates/my_ng_broadcast.htm'
          }
        }
      }
    });

    // load the plugin
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');

    // register tasks
    grunt.registerTask('default', ['jshint', 'cssmin', 'uglify', 'htmlmin']);
};
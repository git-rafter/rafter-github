(function(){
    var gulp = require('gulp'),
        mocha = require('gulp-mocha'),
        jshint = require('gulp-jshint'),
        gutil = require('gulp-util'),
        lodash = require('lodash'),
        paths = {
            scripts: ['commands/**/*.js'],
            tests: ['test/**/*.spec.js']
        };

    // Test Tasks
    gulp.task('mocha', function(){
        global.expect = require('chai').expect;
        global.sinon = require('sinon');
        global.path = require('path');

        return gulp.src(paths.tests, {read: false})
            .pipe(mocha({
                reporter: 'spec',
                should: require('chai').should()
            }));
    });

    gulp.task('lint', function(){
        return gulp.src(paths.scripts.concat(paths.tests))
            .pipe(jshint())
            .pipe(jshint.reporter('jshint-stylish'));
    });

    gulp.task('test', ['lint', 'mocha']);

    gulp.task('default', ['test']);
})();

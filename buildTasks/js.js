// take js file
// watch and rebuild it

var gulp = require('gulp');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var streamify = require('gulp-streamify');
var rev = require('gulp-rev');
var rename = require('gulp-rename');
var buffer = require('gulp-buffer');
var clean = require('gulp-rimraf');
var source = require('vinyl-source-stream');

var browserify = require('browserify');
var watchify = require('watchify');
var reactify = require('reactify');
var to5Browserify = require('6to5-browserify');
var exorcist = require('exorcist');

module.exports = function buildJS(gulp, buildjs) {
  function compile(watch) {
    gutil.log('Starting browserify');

    var entryFile = './assets/js/app.es6.js';

    var bundler = browserify({
      cache: {},
      packageCache: {},
      fullPaths: true,
      debug: true,
      extensions: ['.js', '.es6.js', '.jsx'],
    });

    if (watch) {
      bundler = watchify(bundler);
    }

    bundler.add(entryFile);

    bundler
      .transform(to5Browserify.configure({
        ignore: false,
        only: /.+(?:(?:\.es6\.js)|(?:.jsx))$/,
        extensions: ['.js', '.es6.js', '.jsx' ],
        sourceMap: true,
      }), {
        global: true,
      });

    var rebundle = function () {
      var stream = bundler.bundle();

      stream.on('error', function (err) { console.error(err.toString()) });

      gulp.src(buildjs + '/app*.js')
        .pipe(clean({force: true}));

      stream
        .pipe(exorcist(buildjs + '/app.js.map'))
        .pipe(source(entryFile))
        .pipe(rename('app.js'))
        .pipe(gulp.dest(buildjs))
        .pipe(streamify(uglify()))
        .pipe(rename('app.min.js'))
        .pipe(buffer())
        .pipe(rev())
        .pipe(gulp.dest(buildjs))
        .pipe(rev.manifest())
        .pipe(rename('app-manifest.json'))
        .pipe(gulp.dest(buildjs));
    }

    bundler.on('update', rebundle);
    return rebundle();
  }

  return {
    compile: compile,
  };
}
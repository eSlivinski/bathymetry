var gulp = require("gulp");
var gutil = require("gulp-util");
var watch = require("gulp-watch");
var livereload = require('gulp-livereload');
var clean = require('gulp-clean');
var less = require('gulp-less');
var browserify = require("browserify");
var riotify = require('riotify');
var uglify = require("gulp-uglify");
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var path = require('path');
var CacheBreaker = require('gulp-cache-breaker');

var cb = new CacheBreaker();

gulp.task('clean-scripts', function() {
  gutil.log('gulp run clean-scripts');

  return gulp.src('public/scripts/', { read: false })
    .pipe(clean());
});

gulp.task('clean-styles', function() {
  gutil.log('gulp run clean-styles');

  return gulp.src('public/styles/', { read: false })
    .pipe(clean());
});

gulp.task('styles', function() {
  gutil.log('gulp run styles');

  return gulp.src('public_src/styles/main.less')
    .pipe(less({
      paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(gulp.dest('./public/styles'));
});

gulp.task('scripts', ['clean-scripts'], function () {
  gutil.log('gulp run scripts');

  return browserify({
    entries: ['public_src/scripts/app.js'],
    debug: true
  })
  .transform(riotify)
  .bundle()
  .pipe(source('app.min.js'))
  .pipe(buffer())
  .pipe(uglify())
  .pipe(gulp.dest('./public/scripts'));
});

gulp.task('html', ['scripts', 'styles'], function() {
  gutil.log('gulp run html');

  return gulp.src('public_src/index.html')
      .pipe(cb.gulpCbPath('public'))
      .pipe(gulp.dest('public'));
});

gulp.task('symlink-cb-paths', ['html'], function() {
  gutil.log('gulp run symlink-cb-paths');
  cb.symlinkCbPaths();
});

gulp.task('build', ['symlink-cb-paths'], function() {
  return gutil.log('gulp run build');
});

gulp.task('default', ['build'], function () {
  gutil.log('gulp complete');

  livereload.listen();
  // gulp.watch('public_src/scripts/*.js', ['default']);
  gulp.watch('public_src/styles/*.less', ['default']);
  gulp.watch('public_src/components/*.tag', ['default']);
});

var gulp = require("gulp");
var gutil = require("gulp-util");
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var browsersync = require('browser-sync');
var minifycss = require('gulp-minify-css');
var plumber = require('gulp-plumber');
var less = require('gulp-less');
var browserify = require("browserify");
var riotify = require('riotify');
var uglify = require("gulp-uglify");
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var path = require('path');

var onError = function (err) {
  gutil.beep();
  console.error(err);
  this.emit('end');
};

var getStamp = function() {
  var timestamp = new Date(),
      year = timestamp.getFullYear().toString(),
      month = ('0' + (timestamp.getMonth() + 1)).slice(-2),
      day = ('0' + timestamp.getDate()).slice(-2),
      seconds = timestamp.getSeconds().toString();

  return year + month + day + seconds;
};

gulp.task('browser-sync', function() {
  browsersync({
    server: { baseDir: 'public' },
    port: 8080
  });
});

gulp.task('browsersync-reload', function () {
  browsersync.reload();
});

gulp.task('move-fonts', function() {
  return gulp.src('node_modules/font-awesome/fonts/**')
    .pipe(gulp.dest('public/fonts'));
});

gulp.task('browserify-dependencies', function () {
  return browserify({ entries: ['public_src/scripts/dependencies.js'], debug: true })
    .transform(riotify)
    .bundle()
    .pipe(source('dependencies.min.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest('./public/scripts'));
});

gulp.task('browserify-scripts', function () {
  return browserify({ entries: ['public_src/scripts/app.js'], debug: true })
    .transform(riotify)
    .bundle()
    .pipe(source('app.min.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest('./public/scripts'));
});

gulp.task('compile-styles', function() {
  return gulp.src('public_src/styles/main.less')
    .pipe(plumber({ errorHandler: onError }))
    .pipe(less({ paths: [ path.join(__dirname, 'less', 'includes') ] }))
    .pipe(gulp.dest('./public/styles'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(minifycss())
    .pipe(gulp.dest('./public/styles'))
    .pipe(browsersync.reload({ stream:true }));
});

gulp.task('cachebust', function() {
  return gulp.src('public_src/index.html')
    .pipe(replace('main.min.css', 'main.min.css?' + getStamp()))
    .pipe(replace('app.min.js', 'app.min.js?' + getStamp()))
    .pipe(replace('dependencies.min.js', 'dependencies.min.js?' + getStamp()))
    .pipe(gulp.dest('public/'));
});

gulp.task('watch', ['browser-sync'], function () {
  gulp.watch('public_src/styles/*.less', ['compile-styles']);
  gulp.watch('public_src/components/**/**.**', ['browserify-scripts', 'browsersync-reload']);
  gulp.watch('public_src/scripts/app.js', ['browserify-scripts', 'browsersync-reload']);
  gulp.watch('public_src/scripts/dependencies.js', ['browserify-dependencies', 'browsersync-reload']);
});

gulp.task('build', ['move-fonts', 'compile-styles', 'browserify-dependencies', 'browserify-scripts', 'cachebust']);

gulp.task('default', ['build']);

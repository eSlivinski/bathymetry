var babel = require('gulp-babel');
var browserify = require("browserify");
var browsersync = require('browser-sync');
var buffer = require('vinyl-buffer');
var gulp = require("gulp");
var gutil = require("gulp-util");
var less = require('gulp-less');
var minifycss = require('gulp-minify-css');
var path = require('path');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var riotify = require('riotify');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require("gulp-uglify");

var onError = function (err) {
  var msg = gutil.colors.bold.underline('AN ERROR OCCURED'),
      img = '(╯°□°)╯︵ ┻━┻ ',
      log = gutil.colors.red(msg, img, '\n' + err );
  gutil.log(log).beep();
  this.emit('end');
};

var getStamp = function() {
  var timestamp = new Date();
  return [
    timestamp.getFullYear().toString(),
    ('0' + (timestamp.getMonth() + 1)).slice(-2),
    ('0' + timestamp.getDate()).slice(-2),
    timestamp.getSeconds().toString()
  ].join('');
};

var bundleScripts = function (fileName, es6) {
  var map = browserify('public_src/scripts/' + fileName + '.js')
    .transform(riotify)
    .bundle().on('error', onError)
    .pipe(source( fileName + '.min.js' ))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }));

  if (es6) {
    map.pipe(babel());
  }

  return map
    //.pipe(uglify()).on('error', onError)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/scripts'));
};


// https://www.browsersync.io/docs/options
gulp.task('browser-sync', () => {
  return browsersync({
    server: { baseDir: 'public' },
    port: 8081,
    open: false
  });
});

gulp.task('browsersync-reload', () => {
  browsersync.reload();
});

gulp.task('move-fonts', () => {
  return gulp.src('node_modules/font-awesome/fonts/**')
    .pipe(gulp.dest('public/fonts'));
});

gulp.task('browserify-dependencies', () => {
  return bundleScripts('dependencies', false);
});

gulp.task('browserify-scripts', () => {
  return bundleScripts('app', true);
});

gulp.task('compile-styles', () => {
  return gulp.src('public_src/styles/main.less')
    .pipe(plumber({ errorHandler: onError }))
    .pipe(less({ paths: [ path.join(__dirname, 'less', 'includes') ] }))
    .pipe(gulp.dest('./public/styles'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(minifycss())
    .pipe(gulp.dest('./public/styles'))
    .pipe(browsersync.reload({ stream:true }));
});

gulp.task('cachebust', () => {
  return gulp.src('public_src/index.html')
    .pipe(replace('main.min.css', 'main.min.css?' + getStamp()))
    .pipe(replace('app.min.js', 'app.min.js?' + getStamp()))
    .pipe(replace('dependencies.min.js', 'dependencies.min.js?' + getStamp()))
    .pipe(gulp.dest('public/'));
});

gulp.task('watch', ['browser-sync'], () => {
  gulp.watch('public_src/styles/*.less', ['compile-styles']);
  gulp.watch('public_src/components/**/**.**', ['browserify-scripts', 'browsersync-reload']);
  gulp.watch('public_src/scripts/app.js', ['browserify-scripts', 'browsersync-reload']);
  gulp.watch('public_src/scripts/dependencies.js', ['browserify-dependencies', 'browsersync-reload']);
});


gulp.task('build', [
  'move-fonts',
  'compile-styles',
  'browserify-dependencies',
  'browserify-scripts',
  'cachebust'
], () => {
  gutil.log(gutil.colors.green.bold.underline('BUILD COMPLETE'));
});

gulp.task('test', () => {
  gulp.src('public_src/components/map/map.js')
  .transform(babelify, { presets: ["es2015"] });
});

gulp.task('default', ['build']);

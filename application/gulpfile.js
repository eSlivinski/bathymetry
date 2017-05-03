let babel = require('gulp-babel');
let browserify = require("browserify");
let browsersync = require('browser-sync');
let buffer = require('vinyl-buffer');
let gulp = require("gulp");
let gutil = require("gulp-util");
let less = require('gulp-less');
let minifycss = require('gulp-minify-css');
let nodemon = require('gulp-nodemon');
let path = require('path');
let plumber = require('gulp-plumber');
let rename = require('gulp-rename');
let replace = require('gulp-replace');
let riotify = require('riotify');
let source = require('vinyl-source-stream');
let sourcemaps = require('gulp-sourcemaps');
let uglify = require("gulp-uglify");

function onError (err) {
  let msg = gutil.colors.bold.underline('AN ERROR OCCURED'),
      img = '(╯°□°)╯︵ ┻━┻ ',
      log = gutil.colors.red(msg, img, '\n' + err );
  gutil.log(log).beep();
  this.emit('end');
}

function getStamp () {
  let timestamp = new Date();
  return [
    timestamp.getFullYear().toString(),
    ('0' + (timestamp.getMonth() + 1)).slice(-2),
    ('0' + timestamp.getDate()).slice(-2),
    timestamp.getSeconds().toString()
  ].join('');
}

function bundleScripts (fileName, es6) {
  let map = browserify('public_src/scripts/' + fileName + '.js')
    .transform(riotify)
    .bundle().on('error', onError)
    .pipe(source( fileName + '.min.js' ))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }));

  if (es6) {
    map.pipe(babel());
  }

  return map
    .pipe(uglify()).on('error', onError)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/scripts'));
}

// https://www.browsersync.io/docs/options
gulp.task('browser-sync', () => {
  return browsersync({
    server: { baseDir: 'public' },
    port: 8081,
    open: false
  });
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
    .pipe(browsersync.reload({ stream: true }));
});

gulp.task('cachebust', () => {
  return gulp.src('public_src/index.html')
    .pipe(replace('main.min.css', 'main.min.css?' + getStamp()))
    .pipe(replace('app.min.js', 'app.min.js?' + getStamp()))
    .pipe(replace('dependencies.min.js', 'dependencies.min.js?' + getStamp()))
    .pipe(gulp.dest('public/'));
});

gulp.task('server', () => {
  let stream = nodemon({
    script: 'server/main.js',
    ext: 'html js',
    tasks: []
  });

  stream
      .on('restart', ()=> {
        gutil.log(gutil.colors.blue('restarting node server'));
      })
      .on('crash', () =>{
        onError('Node server has crashed');
        stream.emit('restart', 10);  // restart the server in 10 seconds
      });
});

gulp.task('watch', ['browser-sync', 'server'], () => {
  gulp.watch(['public_src/styles/*.less'], ['compile-styles']);
  gulp.watch(['public_src/components/**/**.**', 'public_src/scripts/app.js'], ['browserify-scripts']);
  gulp.watch(['public_src/scripts/dependencies.js'], ['browserify-dependencies']);
  gulp.watch(['public/scripts/*.js'])
      .on('change', () => {
        gutil.log(gutil.colors.blue('reloading static files'));
        browsersync.reload();
      });
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

gulp.task('default', ['build', 'watch']);

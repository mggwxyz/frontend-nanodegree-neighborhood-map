var gulp = require('gulp');
var gulpIf = require('gulp-if');
var autoprefixer = require('gulp-autoprefixer');
var sass = require('gulp-sass');
var useref = require('gulp-useref');
var cssnano = require('gulp-cssnano');
var cache = require('gulp-cache');
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var uglify = require('gulp-uglify');

gulp.task('watch', ['browserSync', 'sass'],function(){
    gulp.watch('src/scss/*', ['sass']);
    gulp.watch('src/*.html', browserSync.reload);
    gulp.watch('src/js/**/*.js', browserSync.reload);
});

gulp.task('browserSync', function(){
    browserSync.init({
        server: {
            baseDir: 'src'
        }
    })
});

gulp.task('sass', function(){
    return gulp.src('src/scss/**/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('src/css'))
        .pipe(browserSync.reload({
            stream: true
        }));
});

gulp.task('useref', function(){
    return gulp.src('src/*.html')
        .pipe(useref())
        .pipe(gulpIf('*.css', cssnano()))
        .pipe(gulpIf('*.js', uglify()))
        .pipe(gulp.dest('dist'));
});

gulp.task('fonts', function() {
    return gulp.src('src/fonts/**/*')
        .pipe(gulp.dest('dist/fonts'))
})

gulp.task('clean', function() {
    return del.sync('dist');
})

gulp.task('clean:dist', function() {
    return del.sync('dist/**/*');
});

gulp.task('develop', function(callback) {
    runSequence(
        ['sass', 'browserSync'],
        'watch',
        callback
    )
});

gulp.task('build', function(callback) {
    runSequence(
        'clean:dist',
        'sass',
        ['useref', 'fonts'],
        callback
    )
});
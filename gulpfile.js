'use strict';

var gulp = require('gulp'),
    path = require('path'),
    util = require('util'),
    gutil = require('gulp-util'),
    combine = require('stream-combiner'),
    changed = require('gulp-changed'),
    rename = require('gulp-rename'),
    pkg = require('./package.json'),
    chalk = require('chalk'),
    fs = require('fs'),
    less = require('gulp-less'),
    uglify = require('gulp-uglify'),
    ngmin = require('gulp-ngmin'),
    concat = require('gulp-concat-util'),
    sourcemaps = require('gulp-sourcemaps'),
    htmlmin = require('gulp-htmlmin'),
    usemin = require('gulp-usemin'),
    nginclude = require('gulp-nginclude'),
    cleancss = require('gulp-cleancss'),
    runSequence = require('run-sequence'),
    ngtemplate = require('gulp-ngtemplate'),
    uglify = require('gulp-uglify'),
    ngmin = require('gulp-ngmin'),
    clean = require('gulp-clean'),
    src = {
        cwd: 'src',
        dist: 'dist',
        scripts: '*/*.js',
        less: ['modules.less'],
        index: 'module.js',
        templates: '*/*.tpl.html'
    },
    docs = {
        cwd: 'docs',
        tmp: '.tmp',
        dist: 'pages',
        index: 'index.html',
        views: 'views/**/*.html',
        scripts: 'scripts/**/*.js',
        images: 'images/{,*/}*.{jpg,png,svg}',
        styles: 'styles/*.less'
    },
    ports = {
        docs: 9090,
        pages: 9090
    },
    banner = gutil.template('/**\n' +
        ' * <%= pkg.name %>\n' +
        ' * @version v<%= pkg.version %> - <%= today %>\n' +
        ' * @link <%= pkg.homepage %>\n' +
        ' * @author <%= pkg.author.name %> (<%= pkg.author.email %>)\n' +
        ' * @license MIT License, http://www.opensource.org/licenses/MIT\n' +
        ' */\n', {file: '', pkg: pkg, today: new Date().toISOString().substr(0, 10)}),
    createModuleName;

// ========== CLEAN ========== //
gulp.task('clean:dist', function() {
    return gulp.src([src.dist + '/*'], {read: false})
        .pipe(clean());
});

// ========== SCRIPTS ========== //
gulp.task('scripts:dist', function(foo) {

    var combined = combine(

        // Build unified package
        gulp.src([src.index, src.scripts], {cwd: src.cwd})
            .pipe(sourcemaps.init())
            .pipe(ngmin())
            .pipe(concat(pkg.name + '.js', {process: function(src) { return '// Source: ' + path.basename(this.path) + '\n' + (src.trim() + '\n').replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1'); }}))
            .pipe(concat.header('(function(window, document, undefined) {\n\'use strict\';\n'))
            .pipe(concat.footer('\n})(window, document);\n'))
            .pipe(concat.header(banner))
            .pipe(gulp.dest(src.dist))
            .pipe(rename(function(path) { path.extname = '.min.js'; }))
            .pipe(uglify())
            .pipe(concat.header(banner))
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest(src.dist)),

        // Build individual modules
        gulp.src(src.scripts, {cwd: src.cwd})
            .pipe(sourcemaps.init())
            .pipe(ngmin())
            .pipe(rename(function(path){ path.dirname = ''; })) // flatten
            .pipe(concat.header(banner))
            .pipe(gulp.dest(path.join(src.dist, 'modules')))
            .pipe(rename(function(path) { path.extname = '.min.js'; }))
            .pipe(uglify())
            .pipe(concat.header(banner))
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest(path.join(src.dist, 'modules')))

    );

    combined.on('error', function(err) {
        gutil.log(chalk.red(util.format('Plugin error: %s', err.message)));
    });

    return combined;

});


// ========== TEMPLATES ========== //
createModuleName = function(src) { return 'adaptv.adaptStrap.' + src.split(path.sep)[0]; };
gulp.task('templates:dist', function() {

    var combined = combine(

        // Build unified package
        gulp.src(src.templates, {cwd: src.cwd})
            .pipe(htmlmin({removeComments: true, collapseWhitespace: true}))
            .pipe(ngtemplate({module: createModuleName}))
            .pipe(ngmin())
            .pipe(concat(pkg.name + '.tpl.js', {process: function(src) { return '// Source: ' + path.basename(this.path) + '\n' + (src.trim() + '\n').replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1'); }}))
            .pipe(concat.header('(function(window, document, undefined) {\n\'use strict\';\n\n'))
            .pipe(concat.footer('\n\n})(window, document);\n'))
            .pipe(concat.header(banner))
            .pipe(gulp.dest(src.dist))
            .pipe(rename(function(path) { path.extname = '.min.js'; }))
            .pipe(uglify())
            .pipe(concat.header(banner))
            .pipe(gulp.dest(src.dist)),

        // Build individual modules
        gulp.src(src.templates, {cwd: src.cwd})
            .pipe(htmlmin({removeComments: true, collapseWhitespace: true}))
            .pipe(ngtemplate({module: createModuleName}))
            .pipe(ngmin())
            .pipe(rename(function(path){ path.dirname = ''; })) // flatten
            .pipe(concat.header(banner))
            .pipe(gulp.dest(path.join(src.dist, 'modules')))
            .pipe(rename(function(path) { path.extname = '.min.js'; }))
            .pipe(uglify())
            .pipe(concat.header(banner))
            .pipe(gulp.dest(path.join(src.dist, 'modules')))

    );

    combined.on('error', function(err) {
        gutil.log(chalk.red(util.format('Plugin error: %s', err.message)));
    });

    return combined;

});

// ========== STYLE ========== //
gulp.task('less', function () {
    return gulp.src(paths.mainLess)
        .pipe(less())
        .on('error', util.log)
        .pipe(gulp.dest('app'))
        .on('error', util.log)
        .pipe(connect.reload())
        .on('error', util.log);
});

gulp.task('style:dist', function() {
    return gulp.src(src.less, {cwd: src.cwd})
     .pipe(less())
     .pipe(concat(pkg.name + '.css', {process: function(src) { return '/* Style: ' + path.basename(this.path) + '*/\n' + (src.trim() + '\n').replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1'); }}))
     .pipe(concat.header(banner))
     .pipe(gulp.dest(src.dist))
     .on('error', function(err) {
         gutil.log(chalk.red(util.format('Plugin error: %s', err.message)));
     });
});

// ========== DEFAULT TASKS ========== //
gulp.task('dist', function() {
    runSequence('clean:dist', ['templates:dist', 'scripts:dist', 'style:dist']);
});
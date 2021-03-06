var gulp = require('gulp');
var pug = require('gulp-pug');
var sass = require('gulp-sass');
var browserSync = require('browser-sync').create();
var autoprefixer = require('gulp-autoprefixer');
var del = require('del');
var concat = require('gulp-concat');
var csso = require('gulp-csso');
var uglify = require('gulp-uglify');
var svgmin = require('gulp-svgmin');
var cheerio = require('gulp-cheerio');
var replace = require('gulp-replace');
var svgSprite = require('gulp-svg-sprite');
var sourcemaps = require('gulp-sourcemaps');
var notify = require('gulp-notify');
var jsonToSass = require('gulp-json-to-sass');
//var browserify = require('gulp-browserify');
// postcss
var postcss = require('gulp-postcss');
var cssnext = require('postcss-cssnext');
var flexbugs = require('postcss-flexbugs-fixes');
var mqpacker = require("css-mqpacker");
var config = require('./media.json');

var proccessors = [
  //cssnext(),
  flexbugs(),
  mqpacker()
]


var reload      = browserSync.reload;

// =====================  Настройки  =====================

var
  start = 'front';
/*
 1.) 'server' -  gulp запустится в режими с сервером, в этом варианте отключен
 pug, так как он компилируеться на сервере. Так же галп прилинкуется к запущенному серверу.
 Таким образом Можно работать с gulp и любым сервером одновременно. Минус в том что придеться работать,
 в двух консолях (если node.js).
 2.) 'front'  - gulp запуститься в стандартном режиме. Так же скомпилируеться pug в html и положит в папку
 для готовых файлов указанную в настройках. BrowserSync запустить собственный сервер.

 ВАЖНО! При работе с front, возможны ошибки, если раньше использовалась версия server. Так как
 в шаблонах pug, скорее всего будут вставки из базы данных, следовательно pug будет ругаться на
 не известные переменные.
 BrowserSync не будет перезагружать браузер, если на странице явно не указан тег body.
 */

target = false; 						// Автоматическое открытие новой вкладки браузера при запуске gulp
proxy = 'localhost:4000'; // Сервер к которому подключится gulp
notifyBS = false;					// Подсказки browserSync.


// Пути

var path = {

  sourse: {		// Пути исходников


		folder 	: 	'src',       		// Папка где лежат исходника
		pug 		:  	'src/templates', 	      // Папка с шаблонами , только для фронт версии
    views   :   'views',            // Папка с шаблонами , только для серверной версии
		sass 		: 	'sass',					 	// Папка со стилями
		libs 		: 	'node_modules',			// Папка с библиотеками
		js 			: 	'js',								// Папка с модулями js
		svg     :   'sprite',						// Папка с svg для спрайта
		fonts 	:   'fonts',						// Папка со шрифтами
		img 		:   'img',						// Папка с изображениями


  },


  build: {			// Пути готовых файлов

    folder: 'build',   						// Папка где лежат готовые файлы
    css: 'css',					// Папка со стилями
    js: 'js',										// Папка со скриптами
    svg: 'img',									// Папка с готовым svg спрайтом
    fonts: 'fonts',								// Папка со шрифтами
    img: 'img',									// Папка с изображениями
    css_libs: 'foundation.css',				// Файл с дополнительными стилями
    js_libs: 'foundation.js',				// Файл с дополнительными скриптами
    js_file: 'app.js',								// Файл с нашими модулями js

  }
};


// СSS файлы библиоткек

// Тут пишем пути к файлам css, чтобы они превратились в единый файл foundation.css (название файла береться из конфига)
var scssLibs = [
  // Пример:  path.sourse.folder + '/normalize.css/normalize.css',
  path.sourse.libs + '/normalize.css/normalize.css',
  'node_modules/flickity/dist/flickity.min.css',
];


// JS файлы библиотек

// Тут пишем пути к файлам js, чтобы они превратились в единый файл foundation.js (название файла береться из конфига)
var jsLibs = [
  // Пример:  path.sourse.folder + '/jquery/dist/jquery.js',
  path.sourse.libs + '/jquery/dist/jquery.min.js',
  'src/js/modernizr-custom.js',
  'node_modules/svg4everybody/dist/svg4everybody.js',
  'node_modules/picturefill/dist/picturefill.js',
  'node_modules/flickity/dist/flickity.pkgd.min.js',
  'node_modules/video.js',
];


// Шаблоны Для компиляции

// Тут пишем пути к pug файлам, если нужно чтобы их компилировал gulp
var pugFolders = [
  // Пример: path.sourse.pug + '/pages/*.pug',
  path.sourse.pug + '/pages/*.pug'
];


// SCSS файлы для компиляции

// Тут пишем пути к .scss файлам, чтобы они превратились в единый файл css. Sass сам берет название файла из вашей
// scss точки входа.
var sassCompile = [
  // Пример:  path.sourse  + '/' + path.sass + '/app.scss'
  path.sourse.folder + '/' + path.sourse.sass + '/app.scss',
];

// JS модули для компиляции
// Тут пишем пути к модулям js, чтобы они превратились в единый файл app.js (название файла береться из конфига)
// Важен порядок файлов
var mainJs = [
  path.sourse.folder + '/' + path.sourse.js + '/app.js',
];


// =====================  Таски  =====================

// Pug

gulp.task('pug', function (callback) {
  if (start == 'server') {
    callback();
  }
  if (start == 'front') {
    return gulp.src(pugFolders)
      .pipe(pug(
        {
          pretty: true,
          locals: config
        }
      ))
      .on('error', notify.onError(function (error) {
        return {
          title: 'Pug',
          message: error.message
        }
      }))
      .pipe(gulp.dest(path.build.folder))
  }
});


// SASS

gulp.task('sass', function () {
  return gulp.src(sassCompile)
    .pipe(sourcemaps.init())
    .pipe(jsonToSass({
      jsonPath: 'media.json',
      scssPath: 'src/sass/core/_var.scss'
    }))
    .pipe(sass({outputStyle: 'expanded', errLogToConsole: true})).on('error', notify.onError({title: 'Style'}))
    .pipe(autoprefixer(['last 15 versions'], {cascade: true}))
    .pipe(postcss(proccessors))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(path.build.folder + '/' + path.build.css + '/'))
    .pipe(browserSync.stream())
});


// Удаляем папку c компилированными файлами

gulp.task('clean', function () {
  return del(path.build.folder);
});


// CSS файл библиотек

gulp.task('css-libs', function () {
  return gulp.src(scssLibs)
    .pipe(concat(path.build.css_libs))
    .pipe(csso(path.build.css_libs))
    .pipe(gulp.dest(path.build.folder + "/" + path.build.css))
});

// JS файл библиотек

gulp.task('js-libs', function () {
  return gulp.src(jsLibs)
    .pipe(concat(path.build.js_libs))
    .pipe(uglify(path.build.js_libs))
    .pipe(gulp.dest(path.build.folder + "/" + path.build.js))
});


// SVG спрайт
gulp.task('svg-sprite', function () {
  console.log(path.sourse.folder + '/' + path.sourse.svg + '/*.svg');
  return gulp.src(path.sourse.folder + '/' + path.sourse.svg + '/*.svg')
    .pipe(svgmin({
      js2svg: {
        pretty: true
      }
    }))
    .pipe(cheerio({
      run: function ($) {
        $('[fill]').removeAttr('fill');
        $('[stroke]').removeAttr('stroke');
        $('[style]').removeAttr('style');
      },
      parserOptions: {xmlMode: true}
    }))
    .pipe(replace('&gt;', '>'))
    .pipe(svgSprite({
      mode: {
        symbol: {
          sprite: "../sprite.svg"
        }
      }
    }))
    .pipe(gulp.dest(path.build.folder + '/' + path.build.svg))
});

// Копируем файлы

gulp.task('copy', function (callback) {
  // Переносим шрифты
  gulp.src(path.sourse.folder + '/' + path.sourse.fonts + '/**/*')
    .pipe(gulp.dest(path.build.folder + '/' + path.build.fonts));

  // Переносим картинки

  gulp.src(path.sourse.folder + '/' + path.sourse.img + '/**/*')
    .pipe(gulp.dest(path.build.folder + "/" + path.build.img));

  callback();

});


// Склеиваем Js модули

gulp.task('script', function (callback) {

  // main-page.js
  gulp.src(mainJs)
    .pipe(sourcemaps.init())
    //.pipe(browserify()).on('error', notify.onError({title: 'JS'}))
    .pipe(concat(path.build.js_file))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(path.build.folder + '/' + path.build.js))
    .pipe(reload({stream:true}));

  // Тут можно продолжить таск, если нужно чтобы было несколько склееных файлов js

  callback();


});


// Server

gulp.task('server', function () {
  if (start == 'server') {
    browserSync.init({
      open: target,
      proxy: proxy,
      notify: notifyBS
    });
  }

  if (start == 'front') {
    browserSync.init({
      open: target,
      server: path.build.folder,
      notify: notifyBS
    });
  }
});


// Слежка за папкой с иходниками
gulp.task('watch', function () {
  gulp.watch([path.sourse.folder + '/**/*.scss','!' + path.sourse.folder + '/**/_var.scss'], gulp.series('sass'));
  if(start == 'front'){
    gulp.watch(path.sourse.pug + '/**/*.pug', gulp.series('pug', 'reload'));
  }
  if(start == 'server'){
    gulp.watch(path.sourse.views + '/**/*.pug', gulp.series('pug', 'reload'));
  }
  gulp.watch(path.sourse.folder + '/js/**/*.js', gulp.series('script'));
});


// Обновление страницы браузера
gulp.task('reload', function (callback) {
  browserSync.reload();
  callback();
});


// =====================  Порядок выполнения тасков  =====================


gulp.task('build', gulp.series(
    'clean',
    gulp.parallel(
      'sass',
      'pug',
      'css-libs',
      'js-libs',
      'script',
      'svg-sprite',
      'copy'
    )
  )
);

gulp.task('dev', gulp.series(
    'build',
    'watch'
  )
);

gulp.task('default', gulp.series(
  'build',
  gulp.parallel(
    'watch',
    'server'
  ))
);
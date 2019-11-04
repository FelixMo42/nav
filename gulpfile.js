const gulp = require("gulp")
const browserify = require("browserify")
const fs = require("fs")

gulp.task('bundle', async () =>
    browserify({entries: './src/index.js', debug: true})
        .bundle()
        .pipe(fs.createWriteStream("./build/bundle.js"))
)

gulp.task('bundle:watch', async () =>
    gulp.watch("./src/**/*.js", gulp.series("bundle"))
)
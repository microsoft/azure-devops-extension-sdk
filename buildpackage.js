/**
 * This is solely a build script, intended to prep the azure-devops-extension-sdk npm package for publishing.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const fsPromise = require("fs/promises");
const glob = require("glob");
const path = require("path");
const rimraf = require("rimraf");
const UglifyES = require("uglify-es");

(async function() {
    // Clean bin directory
    console.log("# Cleaning bin. Running rimraf ./bin");
    rimraf.sync("./bin");

    // Compile typescript, .d.ts files are directly placed in output folder
    console.log("# Compiling TypeScript. Executing `node_modules\\.bin\\tsc -p ./tsconfig.json`.");

    try {
        execSync("node_modules\\.bin\\tsc -p ./tsconfig.json", {
            stdio: [0, 1, 2],
            shell: true,
            cwd: __dirname,
        });
    } catch (error) {
        console.log("ERROR: Failed to build TypeScript.");
        process.exit(1);
    }

    // Uglify JavaScript
    console.log("# Minifying JS using the UglifyES API, replacing un-minified files.");

    const files = await new Promise((resolve, reject) => {
        glob("./bin/**/*.js", (err, files) => {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    });

    for (const file of files) {
        fs.writeFileSync(
            file.replace(/\.js$/, ".min.js"),
            UglifyES.minify(fs.readFileSync(file, "utf-8"), { compress: true, mangle: true }).code,
            "utf-8",
        );
    }
    console.log(`-- Minified ${files.length} files.`);

    // Copy package.json, LICENSE, README.md to bin
    console.log("# Copying package.json, LICENSE, and README.md to bin.");
    const fileNames = ["package.json", "LICENSE", "README.md"];
    try {
        await Promise.all(
            fileNames.map(
                fileName => fsPromise.copyFile(path.join(__dirname, fileName), path.join(__dirname, "bin", fileName))));
    } catch (error) {
        console.log("ERROR: Failed to copy package.json, LICENSE, or README.md - " + error);
        process.exit(1);
    }
})();
/**
 * This is solely a build script, intended to prep the azure-devops-extension-sdk npm package for publishing.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const glob = require("glob");
const path = require("path");
const copy = require("recursive-copy");
const shell = require("shelljs");
const UglifyES = require("uglify-es");

(async function() {
    // Clean bin directory
    console.log("# Cleaning bin. Running shelljs rm -rf ./bin");
    shell.rm("-rf", "./bin");

    // cross platform compile command
    command = `${path.join("node_modules", ".bin", './')}tsc -p ${path.join("./")}tsconfig.json`

    // Compile typescript
    console.log(`# Compiling TypeScript. Executing \`${command}\`.`);

    try {
        execSync(command, {
            stdio: [0, 1, 2],
            shell: true,
            cwd: __dirname,
        });
    } catch (error) {
        console.log("ERROR: Failed to build TypeScript.");
        process.exit(1);
    }

    // Copy ts files to bin
    console.log("# Copy declare files to bin.");
    try {
        await copy(path.join(__dirname, "src"), path.join(__dirname, "bin"), {
            filter: f => {
                return f.endsWith(".d.ts");
            },
        });
    } catch (e) {
        console.log("Copy failed. " + error);
    }

    // Uglify JavaScript
    console.log("# Minifying JS using the UglifyES API, replacing un-minified files.");
    let count = 0;

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
        if (file.includes("node_modules/")) {
            continue;
        }
        fs.writeFileSync(
            file.substr(0, file.length - 2) + "min.js",
            UglifyES.minify(fs.readFileSync(file, "utf-8"), { compress: true, mangle: true }).code,
            "utf-8",
        );
        count++;
    }
    console.log(`-- Minified ${count} files.`);

    // Copy package.json, LICENSE, README.md to bin
    console.log("# Copying package.json, LICENSE, and README.md to bin.");
    try {
        await copy(path.join(__dirname, "package.json"), path.join(__dirname, "bin", "package.json"));
        await copy(path.join(__dirname, "LICENSE"), path.join(__dirname, "bin", "LICENSE"));
        await copy(path.join(__dirname, "README.md"), path.join(__dirname, "bin", "README.md"));
    } catch (error) {
        console.log("ERROR: Failed to copy package.json, LICENSE, or README.md - " + error);
        process.exit(1);
    }
})();
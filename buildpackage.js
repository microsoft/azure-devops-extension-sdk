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

    // Compile typescript
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

    // Copy ts files to bin
    console.log("# Copy declare files to bin.");
    try {
        await copy(path.join(__dirname, "src"), path.join(__dirname, "bin"), {
            filter: f => {
                return f.endsWith(".d.ts") || f.endsWith(".js");;
            },
        });
    } catch (e) {
        console.log("Copy failed. " + e);
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

    // Move over package.json (Remove vss dependency)
    console.log("# Move over package.json (Remove vss dependency)");
    let vssPackageJson = fs.readFileSync(path.join(__dirname, "node_modules/@htekdev/vss-web-extension-sdk/package.json"))
    const vssPackage = JSON.parse(vssPackageJson)
    let packageJson = fs.readFileSync(path.join(__dirname, "package.json"))
    const package = JSON.parse(packageJson)
    delete package.dependencies["@htekdev/vss-web-extension-sdk"]
    for(var pckg in vssPackage.dependencies){
        package.dependencies[pckg] = vssPackage.dependencies[pckg]
    }
    packageJson = JSON.stringify(package, null, "  ")
    fs.writeFileSync(path.join(__dirname, "bin/package.json"), packageJson, "utf-8")

    // Copy package.json, LICENSE, README.md to bin
    console.log("# Copying LICENSE and README.md to bin.");
    try {
        await copy(path.join(__dirname, "LICENSE"), path.join(__dirname, "bin", "LICENSE"));
        await copy(path.join(__dirname, "README.md"), path.join(__dirname, "bin", "README.md"));
    } catch (error) {
        console.log("ERROR: Failed to copy package.json, LICENSE, or README.md - " + error);
        process.exit(1);
    }

    // Copy vss typings
    console.log("# Copy vss typings");
    await copy(path.join(__dirname, "node_modules/@htekdev/vss-web-extension-sdk/typings"), path.join(__dirname, "bin/typings"));
    
    // Fixing Vss.d.ts
    console.log("# Fixing Vss.d.ts");
    let VssDTContent = fs.readFileSync(path.join(__dirname, "bin/VSS.d.ts"))
    VssDTContent = VssDTContent.toString().replace('types="@htekdev/vss-web-extension-sdk"', 'path="typings/index.d.ts"')
    fs.writeFileSync(path.join(__dirname, "bin/VSS.d.ts"), VssDTContent, "utf-8")
    


    // Generate index.js
    console.log("# Generate SDK.js");
    fs.writeFileSync(
        path.join(__dirname, "bin/SDK.js"),
        [
            fs.readFileSync(path.join(__dirname, "node_modules/@htekdev/vss-web-extension-sdk/lib/VSS.SDK.js")),
            fs.readFileSync(path.join(__dirname, "bin/SDK.js"))
        ].join("\n"),
        "utf-8",
    );

    // Generate index.min.js
    console.log("# Generate SDK.min.js");
    fs.writeFileSync(
        path.join(__dirname, "bin/SDK.min.js"),
        [
            fs.readFileSync(path.join(__dirname, "node_modules/@htekdev/vss-web-extension-sdk/lib/VSS.SDK.min.js")),
            fs.readFileSync(path.join(__dirname, "bin/SDK.min.js"))
        ].join("\n"),
        "utf-8",
    );

    

})();
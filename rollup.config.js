/**
 * Rollup configuration file for building a JavaScript SDK in different formats: ESM and AMD
 */

import typescript from "@rollup/plugin-typescript" // Compiles TypeScript to JavaScript
import del from "rollup-plugin-delete" // Deletes files and folders
import terser from "@rollup/plugin-terser" // Minifies JavaScript
import copy from "rollup-plugin-copy" // Copies files and folders

export default [
    // AMD Bundle: Backward Compatibility
    // console.log("Building AMD Bundle. Also, cleaning bin folder and copying License and package.json to the bin folder (root of the package)."),
    {
        input: "src/SDK.ts",
        external: ["tslib"], // Exclude tslib from the final bundle. It will be imported from external source at runtime.
        output: {
            dir: "bin/amd",
            format: "amd",
            sourcemap: true,
            preserveModules: true
        },
        plugins: [
            del({ targets: "bin/*" }),
            typescript({ tsconfig: "./tsconfig.amd.json" }),
            copy({
                targets: [
                    { src: "package.json", dest: "bin" },
                    { src: "LICENSE", dest: "bin" }
                ]
            }),        
        ]
    },
    // ESM Bundle
    {
        input: "src/SDK.ts",
        output: {
            dir: "bin/esm",
            format: "esm",
            sourcemap: true,
            preserveModules: true
        },
        plugins: [
            del({ targets: "bin/esm/*" }),
            typescript({ tsconfig: "./tsconfig.esm.json" }),
        ]
    },
    // AMD Bundle: Minified - Generating SDK.min.js
    {
        input: "src/SDK.ts",
        output: {
            file: "bin/amd/SDK.min.js",
            format: "amd",
        },
        plugins: [
            typescript({ tsconfig: "./tsconfig.amd.json" }),
            terser()
        ]
    },
    // AMD Bundle: Minified - Generating XDM.min.js
    {
        input: "src/XDM.ts",
        output: {
            file: "bin/amd/XDM.min.js",
            format: "amd",
        },
        plugins: [
            typescript({ tsconfig: "./tsconfig.amd.json" }),
            terser()
        ]
    },
    // ESM Bundle: Minified - Generating SDK.min.js
    {
        input: "src/SDK.ts",
        output: {
            file: "bin/esm/SDK.min.js",
            format: "esm",
        },
        plugins: [
            typescript({ tsconfig: "./tsconfig.esm.json" }),
            terser()
        ]
    },
    // ESM Bundle: Minified - Generating XDM.min.js
    {
        input: "src/XDM.ts",
        output: {
            file: "bin/esm/XDM.min.js",
            format: "esm",
        },
        plugins: [
            typescript({ tsconfig: "./tsconfig.esm.json" }),
            terser()
        ]
    }
]

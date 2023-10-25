/**
 * Rollup configuration file for building a JavaScript SDK in different formats: ESM and AMD
 */

import typescript from "@rollup/plugin-typescript" // Compiles TypeScript to JavaScript
import del from "rollup-plugin-delete" // Deletes files and folders
import terser from "@rollup/plugin-terser" // Minifies JavaScript

export default [
    // AMD Bundle: Backward Compatibility
    // Also, cleaning bin folder first and copying License and package.json to the bin folder (root of the package).
    {
        input: "src/SDK.ts",
        external: ["tslib"], // Exclude tslib from the final bundle. It will be imported from external source at runtime.
        output: {
            dir: "bin",
            format: "amd",
            sourcemap: true,
            preserveModules: true,
        },
        plugins: [
            del({ targets: "bin/*" }),
            typescript({ tsconfig: "./tsconfig.amd.json" }), // Mentioning tsconfig.amd.json file (where declaration is set to true), so d.ts files are generated.
        ]
    },
    // AMD Bundle: Minified - Generating SDK.min.js
    {
        input: "src/SDK.ts",
        output: {
            file: "bin/SDK.min.js",
            format: "amd",
        },
        plugins: [
            typescript(),
            terser()
        ]
    },
    // AMD Bundle: Minified - Generating XDM.min.js
    {
        input: "src/XDM.ts",
        output: {
            file: "bin/XDM.min.js",
            format: "amd",
        },
        plugins: [
            typescript(),
            terser()
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

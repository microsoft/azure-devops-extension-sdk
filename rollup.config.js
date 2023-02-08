import typescript from "@rollup/plugin-typescript"
import del from "rollup-plugin-delete"
import terser from "@rollup/plugin-terser"

const DIST_FOLDER_NAME = "dist"

export default [{
    // ESM Bundle
    input: "src/SDK.ts",
    output: {
        dir: `${DIST_FOLDER_NAME}/esm`,
        format: "esm",
        sourcemap: true,
        preserveModules: true
    },
    plugins: [
        del({
            targets: `${DIST_FOLDER_NAME}/esm/*`,
            verbose: true
        }),
        typescript({
            tsconfig: "./tsconfig.esm.json"
        })
    ]
},
{
    // AMD Bundle
    input: "src/SDK.ts",
    external: ["tslib"],
    output: {
        dir: `${DIST_FOLDER_NAME}/amd`,
        format: "amd",
        sourcemap: true,
        preserveModules: true
    },
    plugins: [
        del({
            targets: `${DIST_FOLDER_NAME}/amd/*`,
            verbose: true
        }),
        typescript({
            tsconfig: "./tsconfig.amd.json"
        })
    ]
},
{
    // Browser Bundle non-minified
    input: "src/SDK.ts",
    output: {
        file: `${DIST_FOLDER_NAME}/browser/SDK.js`,
        format: "iife",
        name: "SDK"
    },
    plugins: [
        del({
            targets: `${DIST_FOLDER_NAME}/browser/SDK.js`,
            verbose: true
        }),
        typescript({
            tsconfig: "./tsconfig.base.json"
        })
    ]
},
{
    // Browser Bundle minified
    input: "src/SDK.ts",
    output: {
        file: `${DIST_FOLDER_NAME}/browser/SDK.min.js`,
        format: "iife",
        name: "SDK"
    },
    plugins: [
        del({
            targets: `${DIST_FOLDER_NAME}/browser/SDK.min.js`,
            verbose: true
        }),
        typescript({
            tsconfig: "./tsconfig.base.json"
        }),
        terser()
    ]
}]
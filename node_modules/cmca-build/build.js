#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "fs"
import { mkdir, writeFile } from "fs/promises"
import { createRequire } from "module"
import { join } from "path"

//dynamic import doesnt work?!
const require = createRequire(import.meta.url)

let isDev = true
let ts = false
/**@type {import("./types").BundlerType} */
let bundlerType = "none"

const root = process.env.ROOT_DIR
if (!root) throw new Error("This Project Can Only Be Executed With Regolith.")
const tsEntry = "./BP/scripts/main.ts"

try {
    /**
     * @type {{envMode : "dev" | "release", bundlerType : import("./types").BundlerType, ts : string}}
     */
    const startOptions = JSON.parse(process.argv[2])
    startOptions.envMode === "release" && (isDev = false)
    startOptions.bundlerType && (bundlerType = startOptions.bundlerType)
    ts = JSON.parse(startOptions.ts)
} catch (error) {
    console.error("Error Parsing Start Args", error)
}

switch (bundlerType) {
    case "none": {
        if (!ts) break
        //dynamic import doesnt work?!
        const tsModule = require("typescript")

        const options = JSON.parse(readFileSync(join(root, "/tsconfig.json")).toString())

        const program = tsModule.createProgram([tsEntry], options)
        delOldFiles()
        if(!existsSync("./BP/scripts/")) mkdirSync("./BP/scripts/")
        const emitResult = program.emit();

        const allDiagnostics = tsModule
            .getPreEmitDiagnostics(program)
            .concat(emitResult.diagnostics);

        allDiagnostics.forEach(diagnostic => {
            if (diagnostic.file && diagnostic.start) {
                let { line, character } = tsModule.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
                let message = tsModule.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
                console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
            } else {
                console.log(tsModule.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
            }
        });
        break
    };
    case "esbuild": {
        const { build } = await import("esbuild")
        const { outputFiles } = await build({
            bundle: true,
            format: "esm",
            outfile: "./BP/scripts/main.js",
            write: false,
            entryPoints: {
                in: ts ? tsEntry : "./BP/scripts/main.js"
            },
            sourcemap: isDev,
            allowOverwrite: true,
            minify: !isDev,
            external: [
                "@minecraft/server",
                "@minecraft/server-ui",
                "@minecraft/server-admin",
                "@minecraft/server-gametest",
                "@minecraft/server-net",
                "@minecraft/server-common",
                "@minecraft/server-editor",
                "@minecraft/debug-utilities",
            ]
        })
        delOldFiles()
        if(!existsSync("./BP/scripts/")) mkdirSync("./BP/scripts/")
        await Promise.all(
            outputFiles.map(x =>
                writeFile(x.path, x.contents)
            )
        )
        break;
    }
}

function delOldFiles() {
    rmSync("./BP/scripts/", { force: true, recursive: true })
}
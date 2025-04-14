import JSZip from "jszip";
import { join } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

/**
 * @param {string} file
 * @param {string} dest
 */
export async function inflate(file, dest) {
    const zip = new JSZip();

    const fileZip = await zip.loadAsync(readFileSync(file))
    await Promise.all(
        Object.entries(fileZip.files).map(async ([fPath, fData]) => {
            if (fData.dir) return
            const destPath = join(dest, fPath)
            const folderPath = destPath.split("\\").slice(0, -1).join("\\");
            !existsSync(folderPath) && mkdirSync(folderPath)
            writeFileSync(destPath, await fData.async("nodebuffer"))
        })
    )
}
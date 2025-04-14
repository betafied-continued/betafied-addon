import { writeFile } from "fs/promises"

/**
 * @param {string | URL | Request} url
 * @param {import("fs").PathLike | import("fs/promises").FileHandle} path
 */
export async function writeDownload(url, path) {
    const buffer = Buffer.from(
        await (
            await fetch(url)
        ).arrayBuffer()
    )
    await writeFile(path, buffer)
}
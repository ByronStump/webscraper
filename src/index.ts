import { argv } from "node:process"
import { getHTML } from "./crawl"

async function main() {
    const args = argv
    if (args.length < 3) {
        console.error("Error, not enough arguments")
        process.exit(1)
    } else if (args.length > 3) {
        console.error(`Error, too many arguments`)
        process.exit(1)
    }
    console.log(`IT'S CRAWL TIME!\n\nCrawling: ${args[2]}`)
    const html = await getHTML(args[2])
    console.log(`\nDATA ACQUIRED...\n`)
    console.log(html)
    process.exit(0)
}

main()
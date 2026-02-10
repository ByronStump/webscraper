import { argv } from "node:process";
import { crawlSiteAsync } from "./crawl";
import { writeCSVReport } from "./report";

async function main() {
  const args = argv;
  if (args.length < 3) {
    console.error("Error, not enough arguments");
    process.exit(1);
  } else if (args.length > 5) {
    console.error(`Error, too many arguments`);
    process.exit(1);
  }
  console.log(`IT'S CRAWL TIME!\n\nCrawling: ${args[2]}`);
  const pages = await crawlSiteAsync(args[2], Number(args[3]), Number(args[4]));
  console.log(`\nDATA ACQUIRED...\n`);
  writeCSVReport(pages)
  console.log("Finished crawling.");
  process.exit(0);
}

main();

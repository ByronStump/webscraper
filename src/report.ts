import * as fs from "node:fs";
import * as path from "node:path";
import { ExtractedPageData } from "./crawl";

export function writeCSVReport(
  pageData: Record<string, ExtractedPageData>,
  filename = "report.csv",
): void {
    const absolutePath = path.resolve(process.cwd(), filename)
    const headers = ["page_url", "h1", "first_paragraph", "outgoing_link_urls", "image_urls"]
    const rows: string[] = [headers.join(",")]
    for (const page of Object.values(pageData)) {
        const url = csvEscape(page.url)
        const h1 = csvEscape(page.h1)
        const first_paragraph = csvEscape(page.first_paragraph)
        const outgoing_links = csvEscape(page.outgoing_links.join(";"))
        const image_urls = csvEscape(page.image_urls.join(";"))
        rows.push([url, h1, first_paragraph, outgoing_links, image_urls].join(","))
    }
    fs.writeFileSync(absolutePath, rows.join("\n"))
}


function csvEscape(field: string) {
  const str = field ?? "";
  const needsQuoting = /[",\n]/.test(str);
  const escaped = str.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}
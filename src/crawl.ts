import { JSDOM } from "jsdom";
import pLimit from "p-limit";

type ExtractedPageData = {
    url: string,
    h1: string,
    first_paragraph: string,
    outgoing_links: string[],
    image_urls: string[]
}

class ConcurrentCrawler {
    baseURL: string;
    pages: Record<string, number>
    limit: ReturnType<typeof pLimit>
    constructor(baseURL: string, maxConcurrency: number = 5) {
        this.baseURL = baseURL;
        this.pages = {};
        this.limit = pLimit(maxConcurrency)
    }
    private addPageVisit(normalizedURL: string): boolean {
        if (this.pages[normalizedURL] > 0) {
            this.pages[normalizedURL]++
            return false
        }
        this.pages[normalizedURL] = 1
        return true
    }
    private async getHTML(currentURL: string): Promise<string> {
        return await this.limit(async () => {
            let response
            try {
                response = await fetch(currentURL, {
                    headers: {
                        "User-Agent": "BootCrawler/1.0"
                    }
                })
            } catch (err) {
                throw new Error(`Got Network error: ${(err as Error).message}`)
            }
                if (!response.ok || response.status >= 400) {
                    throw new Error(`Response status: ${response.status}`)
                }
                const contentType = response.headers.get("content-type")
                if (!contentType || contentType.includes("text/html")) {
                    console.log(`Error getting content-type text/html`)
                }
                const html = await response.text()
                return html
            
        })
    }
    private async crawlPage(currentURL: string): Promise<void> {
        if (new URL(currentURL).hostname !== new URL(this.baseURL).hostname) {
            return
        }
        const normalizedURL = normalizeURL(currentURL)
        if (!this.addPageVisit(normalizedURL)) {
            return
        }
        console.log(`Fetching from: ${currentURL}`)
        const html = await this.getHTML(currentURL)
        if (!html) {
            console.log(`html from: ${currentURL}, doesn't have any html`)
            return
        }
        console.log(`HTML:\n${html}`)
        const htmlURLs = getURLsFromHTML(html, this.baseURL)
        const promiseArray: Promise<void>[] = []
        for (const url of htmlURLs) {
            promiseArray.push(this.crawlPage(url))
        }
        await Promise.all(promiseArray)
    }
    async crawl(): Promise<Record<string, number>> {
        await this.crawlPage(this.baseURL)
        return this.pages
    }
}

export function normalizeURL(rawURL: string): string {
    const parsedURL = new URL(rawURL)
    if (!parsedURL.host) {
        throw new Error(`Error, no host found in rawURL`)

    }
    if (!parsedURL.pathname) {
        throw new Error(`Error, no path found in rawURL`)

    }
    return parsedURL.host + parsedURL.pathname.replace(/\/$/, "")
}

export function getH1FromHTML(html: string): string{
    const dom = new JSDOM(html)
    const h1 = dom.window.document.querySelector("h1")

    return h1 ? h1.innerHTML : ""
}

export function getFirstParagraphFromHTML(html: string): string{
    const dom = new JSDOM(html)
    const doc = dom.window.document
    const main = doc.querySelector("main")
    const p = main?.querySelector("p") ?? doc.querySelector("p")
    return p ? p.innerHTML : ""
}

export function getURLsFromHTML(html: string, baseURL: string): string[] {
    const dom = new JSDOM(html)
    const doc = dom.window.document
    const aTags = Array.from(doc.querySelectorAll("a"))
    const result = []
    for (const tag of aTags) {
        const href = tag.getAttribute("href")
        if (href) {
            result.push((href.startsWith("/") ? baseURL : "") + href)
        } else {
            throw new Error(`Error finding href attribute on url tag`)
        }
    }
    return result
}

export function getImagesFromHTML(html: string, baseURL: string): string[] {
    const dom = new JSDOM(html)
    const doc = dom.window.document
    const imgTags = Array.from(doc.querySelectorAll("img"))
    const result = []
    for (const tag of imgTags) {
        const src = tag.getAttribute("src")
        if (src) {
            result.push((src.startsWith("/") ? baseURL : "") + src)
        } else {
            throw new Error(`Error finding src attribute on img tag`)
        }
    }
    return result
}

export function extractPageData(html: string, pageURL: string): ExtractedPageData {
    return {
        url: pageURL,
        h1: getH1FromHTML(html),
        first_paragraph: getFirstParagraphFromHTML(html),
        outgoing_links: getURLsFromHTML(html, pageURL),
        image_urls: getImagesFromHTML(html, pageURL)
    }
}


export async function crawlSiteAsync(baseURL: string, maxConcurrency: number = 5): Promise<Record<string, number>>{
    const crawler = new ConcurrentCrawler(baseURL, maxConcurrency)
    return await crawler.crawl()
}
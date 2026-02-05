import url from "node:url";
import { JSDOM } from "jsdom";

export function normalizeURL(rawURL: string): string {
    const parsedURL = url.parse(rawURL)
    if (!parsedURL.host) {
        throw new Error(`Error, no host found in rawURL`)

    }
    if (!parsedURL.path) {
        throw new Error(`Error, no path found in rawURL`)

    }
    return parsedURL.host + parsedURL.path.replace(/\/$/, "")
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
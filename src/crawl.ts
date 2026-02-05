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
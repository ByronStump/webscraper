import url from "node:url";

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
import { JSDOM } from "jsdom";
import pLimit from "p-limit";

export type ExtractedPageData = {
  url: string;
  h1: string;
  first_paragraph: string;
  outgoing_links: string[];
  image_urls: string[];
};

class ConcurrentCrawler {
  private baseURL: string;
  private pages: Record<string, ExtractedPageData>;
  private limit: ReturnType<typeof pLimit>;

  private maxPages: number = 100;
  private shouldStop = false;
  private allTasks = new Set<Promise<void>>();
  private abortController = new AbortController();
  private visited = new Set<string>();
  constructor(baseURL: string, maxConcurrency: number = 5, maxPages: number) {
    this.baseURL = baseURL;
    this.pages = {};
    this.limit = pLimit(maxConcurrency);
    this.maxPages = maxPages;
  }
  private addPageVisit(normalizedURL: string): boolean {
    if (this.shouldStop) return false;
    if (this.visited.has(normalizedURL)) return false;
    if (this.visited.size >= this.maxPages) {
      this.shouldStop = true;
      console.log("Reached maximum number of pages to crawl.");
      this.abortController.abort();
      return false;
    }
    this.visited.add(normalizedURL);
    return true;
  }
  private async getHTML(currentURL: string): Promise<string> {
    const { signal } = this.abortController;

    return await this.limit(async () => {
      let response;
      try {
        response = await fetch(currentURL, {
          headers: {
            "User-Agent": "BootCrawler/1.0",
          },
          signal,
        });
      } catch (err) {
        throw new Error((err as Error).message);
      }
      if (!response.ok || response.status >= 400) {
        throw new Error(`Response status: ${response.status}`);
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("text/html")) {
        console.log(`Error getting content-type text/html`);
      }
      const html = await response.text();
      return html;
    });
  }
  private async crawlPage(currentURL: string): Promise<void> {
    if (this.shouldStop) {
      return;
    }
    if (new URL(currentURL).hostname !== new URL(this.baseURL).hostname) {
      return;
    }
    const normalizedURL = normalizeURL(currentURL);
    if (!this.addPageVisit(normalizedURL)) {
      return;
    }
    console.log(`Fetching from: ${currentURL}`);
    let html = "";
    try {
      html = await this.getHTML(currentURL);
      if (!html) {
        console.log(`html from: ${currentURL}, doesn't have any html`);
        return;
      }

      const data = extractPageData(html, currentURL);
      this.pages[normalizedURL] = data;
      const promiseArray: Promise<void>[] = [];
      for (const url of data.outgoing_links) {
        const task = this.crawlPage(url);
        this.allTasks.add(
          task.finally(() => {
            this.allTasks.delete(task);
          }),
        );
        promiseArray.push(task);
      }
      await Promise.all(promiseArray);
    } catch (err) {
      console.log((err as Error).message);
      return;
    }
  }
  async crawl(): Promise<Record<string, ExtractedPageData>> {
    await this.crawlPage(this.baseURL);
    return this.pages;
  }
}

export function normalizeURL(rawURL: string): string {
  const parsedURL = new URL(rawURL);
  if (!parsedURL.host) {
    throw new Error(`Error, no host found in rawURL`);
  }
  if (!parsedURL.pathname) {
    throw new Error(`Error, no path found in rawURL`);
  }
  return parsedURL.host + parsedURL.pathname.replace(/\/$/, "");
}

export function getH1FromHTML(html: string): string {
  const dom = new JSDOM(html);
  const h1 = dom.window.document.querySelector("h1");

  return h1 ? h1.innerHTML : "";
}

export function getFirstParagraphFromHTML(html: string): string {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const main = doc.querySelector("main");
  const p = main?.querySelector("p") ?? doc.querySelector("p");
  return p ? p.innerHTML : "";
}

export function getURLsFromHTML(html: string, baseURL: string): string[] {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const aTags = Array.from(doc.querySelectorAll("a"));
  const result = [];
  for (const tag of aTags) {
    const href = tag.getAttribute("href");
    if (href) {
      try {
        const absoluteURL = new URL(href, baseURL).toString();
        result.push(absoluteURL);
      } catch (err) {
        console.error((err as Error).message);
      }
    }
    if (!href) continue;
  }
  return result;
}

export function getImagesFromHTML(html: string, baseURL: string): string[] {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const imgTags = Array.from(doc.querySelectorAll("img"));
  const result = [];
  for (const tag of imgTags) {
    const src = tag.getAttribute("src");
    if (src) {
      result.push((src.startsWith("/") ? baseURL : "") + src);
    } else {
      throw new Error(`Error finding src attribute on img tag`);
    }
  }
  return result;
}

export function extractPageData(
  html: string,
  pageURL: string,
): ExtractedPageData {
  return {
    url: pageURL,
    h1: getH1FromHTML(html),
    first_paragraph: getFirstParagraphFromHTML(html),
    outgoing_links: getURLsFromHTML(html, pageURL),
    image_urls: getImagesFromHTML(html, pageURL),
  };
}

export async function crawlSiteAsync(
  baseURL: string,
  maxConcurrency: number = 5,
  maxPages: number = 10,
): Promise<Record<string, ExtractedPageData>> {
  const crawler = new ConcurrentCrawler(baseURL, maxConcurrency, maxPages);
  return await crawler.crawl();
}

import { expect, test } from "vitest";
import {
  extractPageData,
  getFirstParagraphFromHTML,
  getH1FromHTML,
  getImagesFromHTML,
  getURLsFromHTML,
  normalizeURL,
} from "./crawl";

test("normalizes input url from: https://blog.boot.dev/path/ to: blog.boot.dev/path", () => {
  expect(normalizeURL("https://blog.boot.dev/path/")).toBe(
    "blog.boot.dev/path",
  );
});
test("normalizes input url from: http://blog.boot.dev/path/ai/ to: blog.boot.dev/path/ai", () => {
  expect(normalizeURL("http://blog.boot.dev/path/ai/")).toBe(
    "blog.boot.dev/path/ai",
  );
});
test("normalizes input url from: https://blog.boot.dev to: blog.boot.dev", () => {
  expect(normalizeURL("https://blog.boot.dev")).toBe("blog.boot.dev");
});
test("normalizes input url from: https://blog.boot.dev/path/aaaa/bbbb/cccc to: blog.boot.dev/path/aaaa/bbbb/cccc", () => {
  expect(normalizeURL("https://blog.boot.dev/path/aaaa/bbbb/cccc")).toBe(
    "blog.boot.dev/path/aaaa/bbbb/cccc",
  );
});

test("getH1FromHTML basic", () => {
  const inputBody = `<html><body><h1>Test Title</h1></body></html>`;
  const actual = getH1FromHTML(inputBody);
  const expected = "Test Title";
  expect(actual).toEqual(expected);
});
test("getH1FromHTML blank", () => {
  const inputBody = `<html><body><p>something something</p><h2>HI</h2></body></html>`;
  const actual = getH1FromHTML(inputBody);
  const expected = "";
  expect(actual).toEqual(expected);
});

test("getFirstParagraphFromHTML main priority", () => {
  const inputBody = `
    <html><body>
      <p>Outside paragraph.</p>
      <main>
        <p>Main paragraph.</p>
      </main>
    </body></html>
  `;
  const actual = getFirstParagraphFromHTML(inputBody);
  const expected = "Main paragraph.";
  expect(actual).toEqual(expected);
});
test("getFirstParagraphFromHTML blank", () => {
  const inputBody = `
    <html><body>
      <h1>something</h1>
      <main>
        <h2>Main paragraph.</h2>
      </main>
    </body></html>
  `;
  const actual = getFirstParagraphFromHTML(inputBody);
  const expected = "";
  expect(actual).toEqual(expected);
});
test("getFirstParagraphFromHTML only outside p", () => {
  const inputBody = `
    <html><body>
      <p>Outside paragraph.</p>
      <main>
        <h2>Main h2.</h2>
      </main>
    </body></html>
  `;
  const actual = getFirstParagraphFromHTML(inputBody);
  const expected = "Outside paragraph.";
  expect(actual).toEqual(expected);
});

test("getURLsFromHTML absolute", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `<html><body><a href="/path/one"><span>Boot.dev</span></a></body></html>`;

  const actual = getURLsFromHTML(inputBody, inputURL);
  const expected = ["https://blog.boot.dev/path/one"];

  expect(actual).toEqual(expected);
});
test("getURLsFromHTML full url", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `<html><body><a href="https://blog.boot.dev/path/one"><span>Boot.dev</span></a></body></html>`;

  const actual = getURLsFromHTML(inputBody, inputURL);
  const expected = ["https://blog.boot.dev/path/one"];

  expect(actual).toEqual(expected);
});
test("getURLsFromHTML double absolute", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `<html><body><a href="/path/one"><span>Boot.dev</span></a><a href="/path/two"><span>Boot.dev</span></a></body></html>`;

  const actual = getURLsFromHTML(inputBody, inputURL);
  const expected = [
    "https://blog.boot.dev/path/one",
    "https://blog.boot.dev/path/two",
  ];

  expect(actual).toEqual(expected);
});
test("getURLsFromHTML missing href", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `<html><body><a>something</a></body></html>`;

  expect(() => getURLsFromHTML(inputBody, inputURL)).toThrow();
});

test("getImagesFromHTML relative", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `<html><body><img src="/logo.png" alt="Logo"></body></html>`;

  const actual = getImagesFromHTML(inputBody, inputURL);
  const expected = ["https://blog.boot.dev/logo.png"];

  expect(actual).toEqual(expected);
});
test("getImagesFromHTML double relative", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `<html><body><img src="/logo.png" alt="Logo"><img src="/logo2.png" alt="Logo"></body></html>`;

  const actual = getImagesFromHTML(inputBody, inputURL);
  const expected = [
    "https://blog.boot.dev/logo.png",
    "https://blog.boot.dev/logo2.png",
  ];

  expect(actual).toEqual(expected);
});
test("getImagesFromHTML full", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `<html><body><img src="https://blog.boot.dev/logo.png" alt="Logo"></body></html>`;

  const actual = getImagesFromHTML(inputBody, inputURL);
  const expected = ["https://blog.boot.dev/logo.png"];

  expect(actual).toEqual(expected);
});
test("getImagesFromHTML missing src", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `<html><body><img alt="Logo"></body></html>`;

  expect(() => getImagesFromHTML(inputBody, inputURL)).toThrow();
});

test("extractPageData basic", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `
    <html><body>
      <h1>Test Title</h1>
      <p>This is the first paragraph.</p>
      <a href="/link1">Link 1</a>
      <img src="/image1.jpg" alt="Image 1">
    </body></html>
  `;

  const actual = extractPageData(inputBody, inputURL);
  const expected = {
    url: "https://blog.boot.dev",
    h1: "Test Title",
    first_paragraph: "This is the first paragraph.",
    outgoing_links: ["https://blog.boot.dev/link1"],
    image_urls: ["https://blog.boot.dev/image1.jpg"],
  };

  expect(actual).toEqual(expected);
});
test("extractPageData basic2", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `
    <html><body>
      <h1>Test Title</h1>
      <p>This is the first paragraph.</p>
      <main>
      <p>This is the main paragraph.</p>
      <a href="/link1">Link 1</a>
      <a href="/link2">Link 2</a>
      <img src="/image1.jpg" alt="Image 1">
      <img src="/image2.jpg" alt="Image 2">
      </main>
      
    </body></html>
  `;

  const actual = extractPageData(inputBody, inputURL);
  const expected = {
    url: "https://blog.boot.dev",
    h1: "Test Title",
    first_paragraph: "This is the main paragraph.",
    outgoing_links: [
      "https://blog.boot.dev/link1",
      "https://blog.boot.dev/link2",
    ],
    image_urls: [
      "https://blog.boot.dev/image1.jpg",
      "https://blog.boot.dev/image2.jpg",
    ],
  };

  expect(actual).toEqual(expected);
});

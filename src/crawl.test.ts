import { expect, test } from "vitest";
import { getFirstParagraphFromHTML, getH1FromHTML, normalizeURL } from "./crawl";

test('normalizes input url from: https://blog.boot.dev/path/ to: blog.boot.dev/path', () => {
    expect(normalizeURL("https://blog.boot.dev/path/")).toBe("blog.boot.dev/path")
})
test('normalizes input url from: http://blog.boot.dev/path/ai/ to: blog.boot.dev/path/ai', () => {
    expect(normalizeURL("http://blog.boot.dev/path/ai/")).toBe("blog.boot.dev/path/ai")
})
test('normalizes input url from: https://blog.boot.dev to: blog.boot.dev', () => {
    expect(normalizeURL("https://blog.boot.dev")).toBe("blog.boot.dev")
})
test('normalizes input url from: https://blog.boot.dev/path/aaaa/bbbb/cccc to: blog.boot.dev/path/aaaa/bbbb/cccc', () => {
    expect(normalizeURL("https://blog.boot.dev/path/aaaa/bbbb/cccc")).toBe("blog.boot.dev/path/aaaa/bbbb/cccc")
})

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
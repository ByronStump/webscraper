import { expect, test } from "vitest";
import { normalizeURL } from "./crawl";

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
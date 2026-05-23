const test = require("node:test");
const assert = require("node:assert/strict");

const plugin = require("../main.js");

test("supportLanguages returns expected Bob language codes", () => {
  const languages = plugin.supportLanguages();
  assert.equal(languages[0], "auto");
  assert.ok(languages.includes("zh-Hans"));
  assert.ok(languages.includes("en"));
  assert.ok(languages.includes("tr"));
});

test("plugin timeout is 120 seconds", () => {
  assert.equal(plugin.pluginTimeoutInterval(), 120);
});

test("detectMimeType detects common image formats", () => {
  assert.equal(plugin.detectMimeType("/9j/abc"), "image/jpeg");
  assert.equal(plugin.detectMimeType("iVBORw0KGgo="), "image/png");
  assert.equal(plugin.detectMimeType("R0lGODlh"), "image/gif");
  assert.equal(plugin.detectMimeType("UklGRabc"), "image/webp");
  assert.equal(plugin.detectMimeType("unknown"), "image/png");
});

test("stripMarkdown converts structured markdown into readable plain text", () => {
  const markdown = [
    "# Invoice",
    "",
    "- **Total**: `$42`",
    "- [Customer](https://example.com)",
    "",
    "| Item | Price |",
    "| --- | --- |",
    "| Tea | 42 |",
    "",
    "![figure](img-0.jpeg)",
    "<br><span>Done</span>"
  ].join("\n");

  const text = plugin.stripMarkdown(markdown);

  assert.match(text, /Invoice/);
  assert.match(text, /Total: \$42/);
  assert.match(text, /Customer/);
  assert.match(text, /Tea\s+42/);
  assert.match(text, /figure/);
  assert.match(text, /Done/);
  assert.doesNotMatch(text, /---/);
  assert.doesNotMatch(text, /https:\/\/example\.com/);
});

test("buildMistralRequest uses defaults and image data URL", () => {
  const request = plugin.buildMistralRequest("iVBORabc", {
    model: "mistral-ocr-latest",
    tableFormat: "markdown",
    extractHeader: false,
    extractFooter: false,
    confidenceScoresGranularity: "none"
  });

  assert.equal(request.model, "mistral-ocr-latest");
  assert.equal(request.document.type, "image_url");
  assert.equal(request.document.image_url, "data:image/png;base64,iVBORabc");
  assert.equal(request.table_format, "markdown");
  assert.equal(request.extract_header, false);
  assert.equal(request.extract_footer, false);
  assert.equal(request.confidence_scores_granularity, undefined);
});

test("buildMistralRequest includes advanced options", () => {
  const request = plugin.buildMistralRequest("/9j/abc", {
    model: "custom-model",
    tableFormat: "html",
    extractHeader: true,
    extractFooter: true,
    confidenceScoresGranularity: "word"
  });

  assert.equal(request.model, "custom-model");
  assert.equal(request.document.image_url, "data:image/jpeg;base64,/9j/abc");
  assert.equal(request.table_format, "html");
  assert.equal(request.extract_header, true);
  assert.equal(request.extract_footer, true);
  assert.equal(request.confidence_scores_granularity, "word");
});

test("parseOcrResponse returns texts for non-empty pages", () => {
  const parsed = plugin.parseOcrResponse({
    pages: [
      { markdown: "# First page" },
      { markdown: "" },
      { markdown: "Second page" }
    ],
    model: "mistral-ocr-latest"
  }, "plain", "en");

  assert.equal(parsed.error, undefined);
  assert.equal(parsed.result.from, "en");
  assert.deepEqual(parsed.result.texts, [
    { text: "First page" },
    { text: "Second page" }
  ]);
});

test("parseOcrResponse preserves markdown when requested", () => {
  const parsed = plugin.parseOcrResponse({
    pages: [{ markdown: "# Title\n\n| A | B |" }]
  }, "markdown", "auto");

  assert.equal(parsed.result.texts[0].text, "# Title\n\n| A | B |");
});

test("parseOcrResponse returns notFound for empty content", () => {
  const parsed = plugin.parseOcrResponse({ pages: [{ markdown: "   " }] }, "plain", "en");
  assert.equal(parsed.error.type, "notFound");
});

test("buildServiceError maps important HTTP statuses", () => {
  assert.equal(plugin.buildServiceError(401, {}).type, "secretKey");
  assert.equal(plugin.buildServiceError(403, {}).type, "secretKey");
  assert.equal(plugin.buildServiceError(429, {}).type, "network");
  assert.equal(plugin.buildServiceError(503, {}).type, "network");
  assert.equal(plugin.buildServiceError(400, { message: "Bad request" }).type, "api");
  assert.equal(plugin.buildServiceError(400, { message: "Bad request" }).message, "Bad request");
});

test("normalization helpers are stable", () => {
  assert.equal(plugin.normalizeApiUrl("https://api.mistral.ai///"), "https://api.mistral.ai");
  assert.equal(plugin.parseTimeout("120"), 120);
  assert.equal(plugin.parseTimeout("10"), 90);
  assert.equal(plugin.parseTimeout("999"), 300);
});

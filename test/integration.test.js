const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const plugin = require("../main.js");

function loadEnv(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index);
    let value = trimmed.slice(index + 1);
    value = value.replace(/^['"]|['"]$/g, "");
    process.env[key] = value;
  }
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { response, data };
}

async function main() {
  const envPath = path.join(__dirname, "..", ".env");
  loadEnv(envPath);

  const apiKey = process.env.MISTRAL_API_KEY;
  assert.ok(apiKey, "MISTRAL_API_KEY is required");

  const models = await requestJson(`${plugin.DEFAULT_API_URL}/v1/models`, {
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });

  assert.equal(models.response.status, 200);
  assert.ok(Array.isArray(models.data.data));

  const png1x1 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
  const body = plugin.buildMistralRequest(png1x1, {
    model: plugin.DEFAULT_MODEL,
    tableFormat: "markdown",
    extractHeader: false,
    extractFooter: false,
    confidenceScoresGranularity: "none"
  });

  const ocr = await requestJson(`${plugin.DEFAULT_API_URL}/v1/ocr`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  assert.equal(ocr.response.status, 200);
  assert.ok(Array.isArray(ocr.data.pages));
  assert.equal(ocr.data.model, plugin.DEFAULT_MODEL);

  console.log("integration ok: models=200 ocr=200 pages=" + ocr.data.pages.length);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

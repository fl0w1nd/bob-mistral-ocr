import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const repo = process.env.GITHUB_REPOSITORY || "fl0w1nd/bob-mistral-ocr";
const tag = process.env.RELEASE_TAG || `v${JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8")).version}`;
const outputPath = process.env.APPCAST_OUTPUT || path.join(rootDir, "dist", "appcast.json");

const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
const infoJson = JSON.parse(fs.readFileSync(path.join(rootDir, "info.json"), "utf8"));
const bundlePath = path.join(rootDir, "dist", "Mistral-OCR.bobplugin");

if (!fs.existsSync(bundlePath)) {
  throw new Error(`Missing bundle: ${bundlePath}`);
}

const sha256 = crypto.createHash("sha256").update(fs.readFileSync(bundlePath)).digest("hex");
const appcast = {
  identifier: infoJson.identifier,
  versions: [
    {
      version: packageJson.version,
      desc: `Release ${packageJson.version}`,
      sha256,
      url: `https://github.com/${repo}/releases/download/${tag}/Mistral-OCR.bobplugin`,
      minBobVersion: infoJson.minBobVersion,
      timestamp: Date.now()
    }
  ]
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(appcast, null, 2) + "\n");
console.log(outputPath);

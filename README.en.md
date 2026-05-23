# Mistral OCR for Bob

[中文](./README.md)

This is a Mistral OCR plugin for Bob's OCR module.

## Installation

### Release install

1. Open the GitHub Releases page.
2. Download the latest `Mistral-OCR.bobplugin`.
3. Double-click the file to install it.
4. Open Bob Preferences, go to `OCR -> Services`, and add `Mistral OCR`.

### Local development

```sh
pnpm bundle
```

The package is written to `dist/Mistral-OCR.bobplugin`.

## How to use

1. Open Bob Preferences.
2. Go to `OCR -> Services`.
3. Add `Mistral OCR`.
4. Enter your `API Key`.
5. Adjust output and advanced options as needed.
6. Use Screenshot OCR, Silent Screenshot OCR, or Finder Image OCR.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| API Key | empty | Your Mistral AI API key. |
| API URL | `https://api.mistral.ai` | Mistral-compatible endpoint URL. |
| Model | `mistral-ocr-latest` | OCR model name. |
| Output Format | `Plain Text` | `Plain Text` removes Markdown syntax, `Markdown` keeps the original structure. |
| Table Format | `Markdown` | Table output format. |
| Extract Header | `Off` | Requests header content. |
| Extract Footer | `Off` | Requests footer content. |
| Confidence Scores | `None` | Returns page or word confidence data. |
| Request Timeout | `90 seconds` | OCR request timeout. |

## Details

### API Key

Used to access the Mistral OCR API. Bob's validation button checks connectivity after you save the key.

### API URL

Useful for proxies, gateways, and self-hosted Mistral-compatible endpoints.

### Model

Defaults to `mistral-ocr-latest`. You can switch to a newer OCR model later.

### Output Format

- `Plain Text`: best for quick reading and copying.
- `Markdown`: best for keeping headings, tables, code blocks, and links.

### Table Format

- `Markdown`: suitable for normal Bob OCR viewing.
- `HTML`: suitable for keeping richer table structure.

### Extract Header / Footer

Useful for papers, reports, and scanned documents.

### Confidence Scores

- `None`: smallest response size.
- `Page`: page-level confidence data.
- `Word`: word-level confidence data for quality review.

### Request Timeout

Useful for large images, slow networks, and multi-page jobs.

## Original Image Translation

This plugin focuses on Bob OCR window and copy workflows.
Mistral OCR currently returns page text, images, tables, and confidence data, without text-level location data for original-image translation.

## Testing

```sh
pnpm test
pnpm test:integration
```

## Packaging

```sh
pnpm bundle
```

## Notes

Mistral OCR returns Markdown, page dimensions, images, tables, and confidence data. This version focuses on Bob's OCR window and copy flows.

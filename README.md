# Mistral OCR for Bob

[English](./README.en.md)

这是一个给 Bob OCR 模块使用的 Mistral OCR 插件。

## 安装

### 发布版安装

1. 打开 GitHub Releases 页面。
2. 下载最新的 `Mistral-OCR.bobplugin`。
3. 双击文件完成安装。
4. 在 Bob 偏好设置里打开 `OCR`，添加 `Mistral OCR` 服务。

### 本地调试

```sh
pnpm bundle
```

生成的插件包在 `dist/Mistral-OCR.bobplugin`。

## 使用流程

1. 在 Bob 偏好设置中打开 `OCR -> 服务`。
2. 添加 `Mistral OCR`。
3. 填入 `API Key`。
4. 按需调整输出格式和高级参数。
5. 使用截图 OCR、静默截图 OCR、访达选图 OCR。

## 参数说明

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| API Key | 空 | Mistral AI API Key。 |
| API URL | `https://api.mistral.ai` | Mistral 兼容接口地址。 |
| Model | `mistral-ocr-latest` | OCR 模型名。 |
| Output Format | `Plain Text` | `Plain Text` 会清理 Markdown 符号，`Markdown` 会保留原始结构。 |
| Table Format | `Native` | 默认沿用 Mistral OCR 原生输出；Markdown/HTML 会请求结构化表格。 |
| Text Blocks | `On` | 请求 `include_blocks=true`，优先输出文字类 block，图表和表格 block 会被跳过。 |
| Extract Header | `Off` | 让服务返回页眉内容。 |
| Extract Footer | `Off` | 让服务返回页脚内容。 |
| Extract Images | `Off` | 关闭时通过 `image_limit=0` 将图片占位符数量控制为 0（如 `![img-0.jpeg]`）。 |
| Confidence Scores | `None` | 返回 page 或 word 级别置信度信息。 |
| Request Timeout | `90 seconds` | OCR 请求超时时间。 |

## 详细说明

### API Key

用于访问 Mistral OCR API。设置完成后可以点击 Bob 偏好设置里的验证按钮检查连通性。

### API URL

适合代理、中转、自建兼容网关场景。默认值直接指向 Mistral 官方接口。

### Model

默认使用 `mistral-ocr-latest`。如果后续 Mistral 发布新的 OCR 模型，也可以在这里切换。

### Output Format

- `Plain Text`：适合直接复制、快速阅读、文本导出。
- `Markdown`：适合保留标题、表格、代码块、链接等结构。

### Table Format

- `Native`：沿用 Mistral OCR 默认输出，适合原文 OCR。
- `Markdown`：适合在 Bob 中查看结构化表格。
- `HTML`：适合保留表格结构细节的场景。

### Text Blocks

开启后会请求 Mistral 返回 `blocks`，纯文本输出优先拼接 `text`、`title`、`caption` 等文字类 block。遇到图表被整理成 Markdown 表格时，保持开启即可获得更接近原文 OCR 的结果。

### Extract Header / Footer

开启后会请求 Mistral 返回页眉和页脚内容，适合论文、报告、扫描文档。

### Confidence Scores

- `None`：默认模式，返回体积更小。
- `Page`：返回页面级置信度。
- `Word`：返回单词级置信度，适合后续质量分析。

### Request Timeout

适合长图、多页文档或网络较慢的场景。常规使用保持默认值即可。

## 原图翻译

这个插件当前面向 Bob OCR 窗口和复制流程。
Mistral OCR 当前返回页面文本、图片、表格和置信度信息，缺少适合原图翻译的文本级位置信息。

## 测试

```sh
pnpm test
pnpm test:integration
```

## 打包

```sh
pnpm bundle
```

## 说明

Mistral OCR 返回的是 Markdown、页面尺寸、图片、表格和置信度数据。这个版本聚焦 Bob OCR 窗口和复制流程。

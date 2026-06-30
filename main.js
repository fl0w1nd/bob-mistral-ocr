var DEFAULT_API_URL = "https://api.mistral.ai";
var DEFAULT_MODEL = "mistral-ocr-latest";
var DEFAULT_TIMEOUT = 90;

var SUPPORTED_LANGUAGES = [
  "auto",
  "zh-Hans",
  "zh-Hant",
  "en",
  "ja",
  "ko",
  "fr",
  "de",
  "es",
  "it",
  "pt",
  "ru",
  "ar",
  "nl",
  "pl",
  "th",
  "vi",
  "tr"
];

function supportLanguages() {
  return SUPPORTED_LANGUAGES.slice();
}

function pluginTimeoutInterval() {
  return 120;
}

function getOptions() {
  if (typeof $option === "undefined" || !$option) {
    return {};
  }
  return $option;
}

function readOption(name, fallback) {
  var options = getOptions();
  var value = options[name];
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return value;
}

function normalizeApiUrl(value) {
  var url = String(value || DEFAULT_API_URL).replace(/^\s+|\s+$/g, "");
  if (!url) {
    url = DEFAULT_API_URL;
  }
  return url.replace(/\/+$/, "");
}

function parseBoolean(value) {
  return value === true || value === "true" || value === "1";
}

function parseTimeout(value) {
  var timeout = parseInt(value, 10);
  if (!isFinite(timeout) || timeout < 30) {
    return DEFAULT_TIMEOUT;
  }
  if (timeout > 300) {
    return 300;
  }
  return timeout;
}


function detectMimeType(base64) {
  var text = String(base64 || "").replace(/\s+/g, "");
  if (text.indexOf("/9j/") === 0) {
    return "image/jpeg";
  }
  if (text.indexOf("iVBOR") === 0) {
    return "image/png";
  }
  if (text.indexOf("R0lGOD") === 0) {
    return "image/gif";
  }
  if (text.indexOf("UklGR") === 0) {
    return "image/webp";
  }
  return "image/png";
}

function stripMarkdown(markdown) {
  return stripTablePlaceholders(markdown)
    .replace(/\r\n/g, "\n")
    .replace(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "")
    .replace(/!img-\d+\.[a-zA-Z0-9]+/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/gm, "")
    .replace(/\|/g, " ")
    .replace(/\*\*\*([^*]+)\*\*\*/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/___([^_]+)___/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/t[dh]>/gi, " ")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/table>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/^[\s]*([-*_])(?:\s*\1){2,}[\s]*$/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/^[ \t]+|[ \t]+$/gm, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+|\s+$/g, "");
}

function stripTablePlaceholders(markdown) {
  return String(markdown || "")
    .replace(/\[tbl-\d+\.[^\]]+\]\(tbl-\d+\.[^)]+\)/g, "")
    .replace(/^\s+|\s+$/g, "");
}

var TEXT_BLOCK_TYPES = {
  text: true,
  title: true,
  list: true,
  equation: true,
  caption: true,
  code: true,
  table: true,
  references: true,
  aside_text: true,
  header: true,
  footer: true,
  signature: true
};

function extractTextBlocks(page) {
  var blocks = page && Array.isArray(page.blocks) ? page.blocks : [];
  var texts = [];

  for (var i = 0; i < blocks.length; i += 1) {
    var block = blocks[i] || {};
    if (!TEXT_BLOCK_TYPES[block.type]) {
      continue;
    }

    var content = block.content;
    if (content === undefined || content === null || content === "") {
      continue;
    }

    content = block.type === "table" ? stripMarkdown(content).replace(/\n{2,}/g, "\n") : String(content);
    content = String(content).replace(/^\s+|\s+$/g, "");
    if (content) {
      texts.push(content);
    }
  }

  return texts.join("\n\n").replace(/^\s+|\s+$/g, "");
}

function extractMarkdownBlocks(page) {
  var blocks = page && Array.isArray(page.blocks) ? page.blocks : [];
  var texts = [];

  for (var i = 0; i < blocks.length; i += 1) {
    var block = blocks[i] || {};
    if (!TEXT_BLOCK_TYPES[block.type]) {
      continue;
    }

    var content = stripTablePlaceholders(block.content);
    if (content) {
      texts.push(content);
    }
  }

  return texts.join("\n\n").replace(/^\s+|\s+$/g, "");
}

function buildMistralRequest(base64Image, options) {
  var request = {
    model: options.model || DEFAULT_MODEL,
    document: {
      type: "image_url",
      image_url: "data:" + detectMimeType(base64Image) + ";base64," + base64Image
    },
    extract_header: !!options.extractHeader,
    extract_footer: !!options.extractFooter
  };

  if (options.tableFormat && options.tableFormat !== "none") {
    request.table_format = options.tableFormat;
  }

  if (options.includeBlocks) {
    request.include_blocks = true;
  }

  if (options.confidenceScoresGranularity && options.confidenceScoresGranularity !== "none") {
    request.confidence_scores_granularity = options.confidenceScoresGranularity;
  }

  if (!options.extractImages) {
    request.image_limit = 0;
  }

  return request;
}

function getRuntimeConfig() {
  return {
    apiKey: readOption("apiKey", ""),
    apiUrl: normalizeApiUrl(readOption("apiUrl", DEFAULT_API_URL)),
    model: String(readOption("model", DEFAULT_MODEL)).replace(/^\s+|\s+$/g, "") || DEFAULT_MODEL,
    outputFormat: readOption("outputFormat", "plain"),
    tableFormat: readOption("tableFormat", "none"),
    extractHeader: parseBoolean(readOption("extractHeader", "false")),
    extractFooter: parseBoolean(readOption("extractFooter", "false")),
    extractImages: parseBoolean(readOption("extractImages", "false")),
    includeBlocks: parseBoolean(readOption("includeBlocks", "true")),
    confidenceScoresGranularity: readOption("confidenceScoresGranularity", "none"),
    requestTimeout: parseTimeout(readOption("requestTimeout", String(DEFAULT_TIMEOUT)))
  };
}

function getErrorMessage(data, fallback) {
  if (!data) {
    return fallback;
  }
  if (typeof data === "string") {
    return data;
  }
  if (data.message) {
    return data.message;
  }
  if (data.error && data.error.message) {
    return data.error.message;
  }
  return fallback;
}

function buildServiceError(statusCode, data) {
  var message = getErrorMessage(data, "Request failed with status " + statusCode);
  var type = "api";

  if (statusCode === 401 || statusCode === 403) {
    type = "secretKey";
    message = "Mistral API 密钥无效或已过期。";
  } else if (statusCode === 429) {
    type = "network";
    message = "请求频率过高，请稍后再试。";
  } else if (statusCode >= 500) {
    type = "network";
    message = "Mistral 服务暂时不可用。";
  }

  return {
    type: type,
    message: message,
    addition: data || {}
  };
}

function parseOcrResponse(data, outputFormat, from, preferBlocks) {
  var pages = data && data.pages ? data.pages : [];
  var texts = [];

  for (var i = 0; i < pages.length; i += 1) {
    var page = pages[i] || {};
    var markdown = page.markdown ? String(page.markdown) : "";
    var blockText = preferBlocks && outputFormat !== "markdown" ? extractTextBlocks(page) : "";
    var blockMarkdown = preferBlocks && outputFormat === "markdown" ? extractMarkdownBlocks(page) : "";
    var content = blockText || blockMarkdown || (outputFormat === "markdown" ? stripTablePlaceholders(markdown) : stripMarkdown(markdown));
    content = content.replace(/^\s+|\s+$/g, "");
    if (content) {
      texts.push({ text: content });
    }
  }

  if (!texts.length) {
    return {
      error: {
        type: "notFound",
        message: "未识别到文本。",
        addition: data || {}
      }
    };
  }

  return {
    result: {
      from: from,
      texts: texts,
      raw: data
    }
  };
}

function pluginValidate(completion) {
  var config = getRuntimeConfig();
  if (!config.apiKey) {
    completion({
      result: false,
      error: {
        type: "secretKey",
        message: "请先填写 Mistral API 密钥。"
      }
    });
    return;
  }

  $http.request({
    method: "GET",
    url: config.apiUrl + "/v1/models",
    header: {
      Authorization: "Bearer " + config.apiKey
    },
    timeout: 10,
    handler: function (resp) {
      if (resp.error) {
        completion({
          result: false,
          error: {
            type: "network",
            message: "网络请求失败。",
            addition: resp.error
          }
        });
        return;
      }

      var statusCode = resp.response && resp.response.statusCode;
      if (statusCode !== 200) {
        completion({
          result: false,
          error: buildServiceError(statusCode, resp.data)
        });
        return;
      }

      completion({ result: true });
    }
  });
}

function ocr(query, completion) {
  var config = getRuntimeConfig();
  if (!config.apiKey) {
    completion({
      error: {
        type: "secretKey",
        message: "请先在插件设置中填写 Mistral API 密钥。"
      }
    });
    return;
  }

  if (!query || !query.image || typeof query.image.toBase64 !== "function") {
    completion({
      error: {
        type: "param",
        message: "OCR 图片输入无效。"
      }
    });
    return;
  }

  var base64Image = query.image.toBase64();
  var requestBody = buildMistralRequest(base64Image, config);

  $http.request({
    method: "POST",
    url: config.apiUrl + "/v1/ocr",
    header: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + config.apiKey
    },
    body: requestBody,
    timeout: config.requestTimeout,
    handler: function (resp) {
      if (resp.error) {
        completion({
          error: {
            type: "network",
            message: "网络请求失败。",
            addition: resp.error
          }
        });
        return;
      }

      var statusCode = resp.response && resp.response.statusCode;
      if (statusCode !== 200) {
        completion({
          error: buildServiceError(statusCode, resp.data)
        });
        return;
      }

      completion(parseOcrResponse(resp.data, config.outputFormat, query.detectFrom || query.from, config.includeBlocks));
    }
  });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DEFAULT_API_URL: DEFAULT_API_URL,
    DEFAULT_MODEL: DEFAULT_MODEL,
    supportLanguages: supportLanguages,
    pluginTimeoutInterval: pluginTimeoutInterval,
    detectMimeType: detectMimeType,
    stripTablePlaceholders: stripTablePlaceholders,
    stripMarkdown: stripMarkdown,
    extractTextBlocks: extractTextBlocks,
    extractMarkdownBlocks: extractMarkdownBlocks,
    buildMistralRequest: buildMistralRequest,
    parseOcrResponse: parseOcrResponse,
    buildServiceError: buildServiceError,
    normalizeApiUrl: normalizeApiUrl,
    parseTimeout: parseTimeout
  };
}

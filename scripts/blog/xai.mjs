// xAI（Grok）REST 客户端：文章起草用 chat completions 结构化输出，配图用 Imagine 图像生成。
// 零依赖，只用 Node 22 内建 fetch。

export const xaiBaseUrl = process.env.XAI_BASE_URL ?? "https://api.x.ai/v1";
export const defaultTextModel = process.env.XAI_TEXT_MODEL ?? "grok-4.6";
export const defaultImageModel = process.env.XAI_IMAGE_MODEL ?? "grok-imagine-image-2.0";
export const defaultImageResolution = process.env.XAI_IMAGE_RESOLUTION ?? "2k";
export const defaultImageQuality = process.env.XAI_IMAGE_QUALITY ?? "medium";

export function requireXaiKey() {
  const key = process.env.XAI_API_KEY;
  if (!key) {
    throw new Error("缺少 XAI_API_KEY：文章起草与 Grok 生图都需要 xAI API 密钥（https://console.x.ai）。");
  }
  return key;
}

async function xaiFetch(path, body, { retries = 2 } = {}) {
  const key = requireXaiKey();
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetch(`${xaiBaseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    });
    if (response.ok) return response.json();
    const text = await response.text();
    lastError = new Error(`xAI ${path} 返回 HTTP ${response.status}：${text.slice(0, 600)}`);
    // 4xx（除 429）是请求本身的问题，重试没有意义。
    if (response.status < 500 && response.status !== 429) throw lastError;
    await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
  }
  throw lastError;
}

/**
 * 请求 Grok 按 JSON Schema 输出。优先使用严格 json_schema；
 * 若模型/账号不支持，退回 json_object 并在本地解析。
 */
export async function chatJson({ system, user, schema, schemaName = "blog_post", model = defaultTextModel, temperature = 0.4 }) {
  const messages = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
  let payload;
  try {
    payload = await xaiFetch("/chat/completions", {
      model,
      messages,
      temperature,
      response_format: { type: "json_schema", json_schema: { name: schemaName, schema, strict: true } },
    });
  } catch (error) {
    if (!/HTTP 4\d\d/.test(String(error.message))) throw error;
    payload = await xaiFetch("/chat/completions", {
      model,
      messages: [...messages, { role: "system", content: `只输出一个符合以下 JSON Schema 的 JSON 对象，不要输出任何解释：${JSON.stringify(schema)}` }],
      temperature,
      response_format: { type: "json_object" },
    });
  }
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("xAI 没有返回文本内容");
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return { json: JSON.parse(trimmed), model: payload.model ?? model, usage: payload.usage ?? null };
}

/**
 * 用 Grok Imagine 生成一张图，返回 JPEG Buffer 与实际使用的模型名。
 */
export async function generateImage({
  prompt,
  aspectRatio = "16:9",
  model = defaultImageModel,
  resolution = defaultImageResolution,
  quality = defaultImageQuality,
}) {
  const body = {
    model,
    prompt,
    n: 1,
    aspect_ratio: aspectRatio,
    resolution,
    response_format: "b64_json",
  };
  // quality 目前只有 grok-imagine-image-2.0 支持；其他模型传了会 400。
  if (model === "grok-imagine-image-2.0" && quality) body.quality = quality;
  const payload = await xaiFetch("/images/generations", body);
  const item = payload?.data?.[0];
  if (!item?.b64_json) throw new Error("xAI 图像接口没有返回 b64_json 数据");
  return {
    buffer: Buffer.from(item.b64_json, "base64"),
    model: payload.model ?? model,
    revisedPrompt: item.revised_prompt ?? null,
  };
}

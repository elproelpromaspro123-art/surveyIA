import { log } from "./index";
const fetchFn: typeof fetch = (globalThis as any).fetch;

interface CloudflareRequest {
  prompt: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  includeThinking?: boolean;
  imageData?: {
    mimeType: string;
    data: string; // base64
  };
  tools?: any[];
}

interface CloudflareResponse {
  text: string;
  model: string;
  usage?: any;
}

function getCloudflareConfig() {
  const token = process.env.CLOUDFLARE_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token) throw new Error("CLOUDFLARE_TOKEN is not set in environment");
  if (!accountId) throw new Error("CLOUDFLARE_ACCOUNT_ID is not set in environment");
  return { token, accountId };
}

async function parseResultJson(json: any): Promise<string> {
  if (!json) return "";
  if (typeof json.result === "string") return json.result;
  if (Array.isArray(json.result) && typeof json.result[0] === "string") return json.result[0];
  if (json.output && typeof json.output === "string") return json.output;
  if (json.response && typeof json.response === "string") return json.response;
  return JSON.stringify(json.result || json, null, 2);
}

export async function generateCloudflareResponse(
  req: CloudflareRequest
): Promise<CloudflareResponse> {
  const { token, accountId } = getCloudflareConfig();

  const modelName = req.model;
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${encodeURIComponent(
    modelName
  )}`;

  const body: any = {};
  body.prompt = req.prompt;
  if (req.maxTokens) body.max_tokens = req.maxTokens;
  if (req.temperature !== undefined) body.temperature = req.temperature;

  if (req.imageData) {
    const dataUrl = `data:${req.imageData.mimeType};base64,${req.imageData.data}`;
    body.image = dataUrl;
    body.image_url = { url: dataUrl };
  }

  if (req.tools) body.tools = req.tools;

  // Provide function calling / tool configuration to allow model to use tools
  body.tool_config = {
    function_calling: { mode: "any" },
  };

  // If no explicit tools provided, attach a rich default toolset to maximize capability
  if (!req.tools) {
    // A conservative but explicit default toolset. These names match common
    // Cloudflare tool capabilities; account permissions may restrict some tools.
    body.tools = [
      {
        name: "web_search",
        description: "Search the web for current facts and grounding",
        // optional: example schema for parameters a tool might accept
        params: { query: "string", top_k: "number" },
      },
      {
        name: "vision",
        description: "Image understanding and multimodal reasoning",
        params: { image_data: "data_url" },
      },
      {
        name: "code_execution",
        description: "Run and evaluate code for exact calculations",
        params: { language: "string", code: "string" },
      },
      {
        name: "file_tools",
        description: "Process uploaded files and convert to markdown/text",
        params: { file_id: "string" },
      },
      {
        name: "url_context",
        description: "Provide context from a given URL",
        params: { url: "string" },
      },
      {
        name: "browser",
        description: "Browser-like retrieval for JS-enabled pages",
        params: { url: "string", wait_for: "number" },
      },
    ];
  }

  log(`Calling Cloudflare model ${modelName}`, "cloudflare-service");

  // Simple retry loop for transient rate limits (429). Respect Retry-After if provided.
  let attempts = 0;
  let res: Response | null = null;
  let lastText = "";
  while (attempts < 3) {
    attempts++;
    res = await fetchFn(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) break;

    const txt = await res.text().catch(() => "");
    lastText = txt;
    if (res.status === 429) {
      const ra = res.headers.get("Retry-After");
      const wait = ra ? parseInt(ra, 10) * 1000 : Math.min(1000 * 2 ** attempts, 10000);
      await new Promise((r) => setTimeout(r, isNaN(wait) ? 1000 : wait));
      continue;
    }
    // non-retryable error
    const err = new Error(`Cloudflare API error ${res.status}: ${txt}`);
    throw err;
  }

  if (!res) throw new Error("Cloudflare fetch failed");

  if (!res.ok) {
    const txt = lastText || (await res.text().catch(() => ""));
    const retryAfter = res.headers.get("Retry-After") || undefined;
    const err: any = new Error(`Cloudflare API error ${res.status}: ${txt}`);
    if (res.status === 429) {
      err.code = "RATE_LIMIT";
      err.retryAfter = retryAfter;
    }
    throw err;
  }

  const json = await res.json();
  const text = await parseResultJson(json);

  log(`Cloudflare model ${modelName} returned ${text?.slice?.(0,120)}`, "cloudflare-service");

  return { text, model: modelName, usage: json.usage };
}

export async function streamCloudflareResponse(_req: CloudflareRequest) {
  const { token, accountId } = getCloudflareConfig();
  const modelName = _req.model;
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${encodeURIComponent(
    modelName
  )}`;

  const body: any = {};
  body.prompt = _req.prompt;
  if (_req.maxTokens) body.max_tokens = _req.maxTokens;
  if (_req.temperature !== undefined) body.temperature = _req.temperature;
  if (_req.imageData) {
    const dataUrl = `data:${_req.imageData.mimeType};base64,${_req.imageData.data}`;
    body.image = dataUrl;
    body.image_url = { url: dataUrl };
  }
  if (_req.tools) body.tools = _req.tools;
  body.tool_config = { function_calling: { mode: "any" } };
  // Ask Cloudflare to stream if supported
  body.stream = true;

  const res = await fetchFn(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    const err: any = new Error(`Cloudflare API error ${res.status}: ${txt}`);
    if (res.status === 429) {
      err.code = "RATE_LIMIT";
      err.retryAfter = res.headers.get("Retry-After") || undefined;
    }
    throw err;
  }

  // If the response is a streaming body (SSE or ndjson), yield parsed chunks.
  const reader = res.body?.getReader();
  if (!reader) {
    const json = await res.json();
    const t = await parseResultJson(json);
    async function* single() {
      yield t;
    }
    return single();
  }

  async function* gen() {
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        buffer += decoder.decode(value, { stream: true });
        // Try SSE-style split
        const parts = buffer.split(/\n\n/);
        buffer = parts.pop() || "";
        for (const part of parts) {
          const lines = part.split(/\n/);
          for (const line of lines) {
            if (!line) continue;
            let payload = line;
            if (line.startsWith("data:")) payload = line.replace(/^data:\s?/, "");
            payload = payload.trim();
            try {
              const obj = JSON.parse(payload);
              // Common field names for incremental text
              if (obj.delta || obj.choices || obj.output) {
                // attempt to extract a text fragment
                const frag = obj.delta?.content ?? obj.choices?.[0]?.delta?.content ?? obj.output ?? JSON.stringify(obj);
                yield String(frag);
              } else if (typeof obj === "string") {
                yield obj;
              } else {
                yield JSON.stringify(obj);
              }
            } catch (e) {
              // not JSON, yield raw
              yield payload;
            }
          }
        }
      }
    }
    // flush any remaining buffer
    if (buffer) {
      const b = buffer.trim();
      if (b) {
        try {
          const obj = JSON.parse(b);
          const frag = obj.delta?.content ?? obj.choices?.[0]?.delta?.content ?? obj.output ?? JSON.stringify(obj);
          yield String(frag);
        } catch (e) {
          yield b;
        }
      }
    }
  }

  return gen();
}

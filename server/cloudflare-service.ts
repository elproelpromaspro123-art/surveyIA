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
    body.tools = [
      { name: "web_search", description: "Search the web for current facts and grounding" },
      { name: "vision", description: "Image understanding and multimodal reasoning" },
      { name: "code_execution", description: "Run and evaluate code for exact calculations" },
      { name: "file_tools", description: "Process uploaded files and convert to markdown/text" },
      { name: "url_context", description: "Provide context from a given URL" },
      { name: "browser", description: "Browser-like retrieval for JS-enabled pages" },
    ];
  }

  log(`Calling Cloudflare model ${modelName}`, "cloudflare-service");

  const res = await fetchFn(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Cloudflare API error ${res.status}: ${txt}`);
  }

  const json = await res.json();
  const text = await parseResultJson(json);

  log(`Cloudflare model ${modelName} returned ${text?.slice?.(0,120)}`, "cloudflare-service");

  return { text, model: modelName, usage: json.usage };
}

export async function streamCloudflareResponse(_req: CloudflareRequest) {
  const r = await generateCloudflareResponse(_req);
  async function* gen() {
    yield r.text;
  }
  return gen();
}

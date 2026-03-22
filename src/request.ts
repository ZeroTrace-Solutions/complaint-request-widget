import type { ComplaintPayload, RequestAdapter } from "./types";

const REQUEST_TIMEOUT_MS = 15000;

function assertSafeEndpoint(apiEndpoint?: string): string {
  if (!apiEndpoint) {
    throw new Error("Provide either apiEndpoint or requestAdapter.");
  }

  if (apiEndpoint.startsWith("/")) {
    return apiEndpoint;
  }

  let parsed: URL;
  try {
    parsed = new URL(apiEndpoint);
  } catch {
    throw new Error("Invalid apiEndpoint URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("apiEndpoint protocol must be http or https.");
  }

  return apiEndpoint;
}

export async function submitComplaint(
  payload: ComplaintPayload,
  apiEndpoint?: string,
  adapter?: RequestAdapter
): Promise<void> {
  if (adapter) {
    await adapter(payload);
    return;
  }

  const endpoint = assertSafeEndpoint(apiEndpoint);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
}

export type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeMissingDeep<T extends JsonRecord>(base: T, incoming: JsonRecord): T {
  const output: JsonRecord = { ...base };

  for (const [key, value] of Object.entries(incoming)) {
    const current = output[key];

    if (current === undefined) {
      output[key] = value;
      continue;
    }

    if (isRecord(current) && isRecord(value)) {
      output[key] = mergeMissingDeep(current, value);
    }
  }

  return output as T;
}

export interface RawArtifactData {
  [key: string]: unknown;
}

function normalizeString(val: unknown): string {
  if (typeof val === 'string') return val.trim();
  if (val instanceof Date) return val.toISOString();
  return '';
}

function normalizeStringLower(val: unknown): unknown {
  if (typeof val === 'string') return val.trim().toLowerCase();
  if (val instanceof Date) return val.toISOString();
  return val;
}

function normalizeStringArray(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val
      .filter((v): v is string => typeof v === 'string')
      .map((s) => s.trim());
  }
  if (typeof val === 'string' && val.trim()) {
    return [val.trim()];
  }
  return [];
}

export function normalizeRaw(
  data: RawArtifactData,
  body: string,
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {
    id: normalizeString(data['id']),
    type: normalizeStringLower(data['type']),
    title: normalizeString(data['title']),
    status: normalizeStringLower(data['status']),
    scope: normalizeStringLower(data['scope']),
    tags: normalizeStringArray(data['tags']),
    summary: normalizeString(data['summary']),
    created_at: normalizeString(data['created_at']),
    updated_at: normalizeString(data['updated_at']),
    sources: normalizeStringArray(data['sources']),
    supersedes: normalizeStringArray(data['supersedes']),
    body: body.trim(),
  };

  if (data['repo'] !== undefined) {
    normalized['repo'] = normalizeString(data['repo']);
  }
  if (data['session_id'] !== undefined) {
    normalized['session_id'] = normalizeString(data['session_id']);
  }
  if (data['severity'] !== undefined) {
    normalized['severity'] = normalizeStringLower(data['severity']);
  }
  if (data['language'] !== undefined) {
    normalized['language'] = normalizeString(data['language']);
  }

  return normalized;
}

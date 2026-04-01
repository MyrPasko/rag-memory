import { z, ZodError, type ZodType } from 'zod';
import { buildDerivedIndex } from '../retrieval/indexer.js';
import {
  fetchArtifactSummary,
  findCanonicalPattern,
  findRelatedSessions,
  getRepoConventions,
} from '../retrieval/retrieve.js';
import type {
  ArtifactSummary,
  DerivedIndex,
  RetrievalMatch,
  RetrievalProvenance,
} from '../retrieval/types.js';

const DEFAULT_RESULT_LIMIT = 5;
const DEFAULT_MAX_RESULT_LIMIT = 5;
const DEFAULT_MAX_TITLE_LENGTH = 120;
const DEFAULT_MAX_SUMMARY_LENGTH = 240;
const DEFAULT_MAX_LIST_ITEMS = 6;
const DEFAULT_MAX_LIST_VALUE_LENGTH = 96;
const DEFAULT_MAX_PROVENANCE_ITEMS = 4;
const DEFAULT_MAX_PROVENANCE_VALUE_LENGTH = 80;

export const MCP_READ_TOOL_NAMES = [
  'get_repo_conventions',
  'find_canonical_pattern',
  'find_related_sessions',
  'fetch_artifact_summary',
] as const;

export type McpReadToolName = (typeof MCP_READ_TOOL_NAMES)[number];
type TruncatedArtifactField = 'title' | 'summary' | 'tags' | 'sources';

export interface McpReadToolDefinition {
  name: McpReadToolName;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpReadServerOptions {
  rootDir?: string;
  loadIndex?: () => Promise<DerivedIndex>;
  defaultLimit?: number;
  maxLimit?: number;
  maxTitleLength?: number;
  maxSummaryLength?: number;
  maxListItems?: number;
  maxListValueLength?: number;
  maxProvenanceItems?: number;
  maxProvenanceValueLength?: number;
}

export interface McpArtifactSummary {
  id: string;
  type: ArtifactSummary['type'];
  title: string;
  status: ArtifactSummary['status'];
  scope: ArtifactSummary['scope'];
  summary: string;
  tags: string[];
  sources: string[];
  created_at: string;
  updated_at: string;
  relative_path: string;
  collection: ArtifactSummary['collection'];
  repo?: string;
  session_id?: string;
  severity?: ArtifactSummary['severity'];
  language?: ArtifactSummary['language'];
  truncated_fields: TruncatedArtifactField[];
}

export interface McpRetrievalProvenance {
  field: RetrievalProvenance['field'];
  match: RetrievalProvenance['match'];
  value: string;
  truncated?: boolean;
}

export interface McpRetrievalMatch {
  artifact: McpArtifactSummary;
  score: number;
  provenance: McpRetrievalProvenance[];
  provenance_truncated: boolean;
}

export interface GetRepoConventionsResult {
  tool: 'get_repo_conventions';
  query: {
    repo: string;
    text?: string;
    limit: number;
  };
  results: McpRetrievalMatch[];
  result_count: number;
  truncated: boolean;
}

export interface FindCanonicalPatternResult {
  tool: 'find_canonical_pattern';
  query: {
    id?: string;
    text?: string;
    repo?: string;
  };
  match: McpRetrievalMatch | null;
  truncated: boolean;
}

export interface FindRelatedSessionsResult {
  tool: 'find_related_sessions';
  query: {
    text: string;
    limit: number;
  };
  results: McpRetrievalMatch[];
  result_count: number;
  truncated: boolean;
}

export interface FetchArtifactSummaryResult {
  tool: 'fetch_artifact_summary';
  id: string;
  found: boolean;
  artifact: McpArtifactSummary | null;
  provenance: McpRetrievalProvenance[];
  truncated: boolean;
}

export type McpReadToolResult =
  | GetRepoConventionsResult
  | FindCanonicalPatternResult
  | FindRelatedSessionsResult
  | FetchArtifactSummaryResult;

export class McpToolValidationError extends Error {
  constructor(
    public readonly toolName: McpReadToolName,
    public readonly cause: ZodError,
  ) {
    super(`Invalid arguments for MCP read tool "${toolName}"`);
    this.name = 'McpToolValidationError';
  }
}

export class McpToolNotFoundError extends Error {
  constructor(public readonly toolName: string) {
    super(`Unknown MCP read tool "${toolName}"`);
    this.name = 'McpToolNotFoundError';
  }
}

const getRepoConventionsArgsSchema = z
  .object({
    repo: z.string().trim().min(1),
    text: z.string().optional(),
    limit: z.coerce.number().int().positive().optional(),
  })
  .strict();

const findCanonicalPatternArgsSchema = z
  .object({
    id: z.string().optional(),
    text: z.string().optional(),
    repo: z.string().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const hasId = normalizeOptionalString(value.id) !== undefined;
    const hasText = normalizeOptionalString(value.text) !== undefined;

    if (!hasId && !hasText) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either "id" or "text" must be provided.',
      });
    }
  });

const findRelatedSessionsArgsSchema = z
  .object({
    text: z.string().trim().min(1),
    limit: z.coerce.number().int().positive().optional(),
  })
  .strict();

const fetchArtifactSummaryArgsSchema = z
  .object({
    id: z.string().trim().min(1),
  })
  .strict();

export const MCP_READ_TOOL_DEFINITIONS: readonly McpReadToolDefinition[] = [
  {
    name: 'get_repo_conventions',
    description:
      'Return repo-scoped convention matches with bounded, provenance-rich summaries.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        repo: { type: 'string', minLength: 1 },
        text: { type: 'string' },
        limit: { type: 'integer', minimum: 1, default: DEFAULT_RESULT_LIMIT },
      },
      required: ['repo'],
    },
  },
  {
    name: 'find_canonical_pattern',
    description:
      'Resolve one canonical pattern by exact id or deterministic text ranking.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: { type: 'string' },
        text: { type: 'string' },
        repo: { type: 'string' },
      },
    },
  },
  {
    name: 'find_related_sessions',
    description:
      'Return historical session matches while keeping canonical knowledge isolated.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        text: { type: 'string', minLength: 1 },
        limit: { type: 'integer', minimum: 1, default: DEFAULT_RESULT_LIMIT },
      },
      required: ['text'],
    },
  },
  {
    name: 'fetch_artifact_summary',
    description:
      'Fetch one compact artifact summary by exact id with deterministic provenance.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: { type: 'string', minLength: 1 },
      },
      required: ['id'],
    },
  },
] as const;

interface NormalizedToolLimits {
  defaultLimit: number;
  maxLimit: number;
  maxTitleLength: number;
  maxSummaryLength: number;
  maxListItems: number;
  maxListValueLength: number;
  maxProvenanceItems: number;
  maxProvenanceValueLength: number;
}

interface TruncatedValue {
  value: string;
  truncated: boolean;
}

interface TruncatedList {
  items: string[];
  truncated: boolean;
}

function normalizeOptionalString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value) || value === undefined) {
    return fallback;
  }

  return Math.max(1, Math.trunc(value));
}

function normalizeToolLimits(options: McpReadServerOptions): NormalizedToolLimits {
  const maxLimit = normalizePositiveInteger(options.maxLimit, DEFAULT_MAX_RESULT_LIMIT);

  return {
    defaultLimit: Math.min(
      normalizePositiveInteger(options.defaultLimit, DEFAULT_RESULT_LIMIT),
      maxLimit,
    ),
    maxLimit,
    maxTitleLength: normalizePositiveInteger(
      options.maxTitleLength,
      DEFAULT_MAX_TITLE_LENGTH,
    ),
    maxSummaryLength: normalizePositiveInteger(
      options.maxSummaryLength,
      DEFAULT_MAX_SUMMARY_LENGTH,
    ),
    maxListItems: normalizePositiveInteger(options.maxListItems, DEFAULT_MAX_LIST_ITEMS),
    maxListValueLength: normalizePositiveInteger(
      options.maxListValueLength,
      DEFAULT_MAX_LIST_VALUE_LENGTH,
    ),
    maxProvenanceItems: normalizePositiveInteger(
      options.maxProvenanceItems,
      DEFAULT_MAX_PROVENANCE_ITEMS,
    ),
    maxProvenanceValueLength: normalizePositiveInteger(
      options.maxProvenanceValueLength,
      DEFAULT_MAX_PROVENANCE_VALUE_LENGTH,
    ),
  };
}

function clampLimit(
  requestedLimit: number | undefined,
  limits: NormalizedToolLimits,
): { limit: number; truncated: boolean } {
  const normalizedRequested =
    requestedLimit === undefined
      ? limits.defaultLimit
      : normalizePositiveInteger(requestedLimit, limits.defaultLimit);
  const limit = Math.min(normalizedRequested, limits.maxLimit);

  return {
    limit,
    truncated: normalizedRequested > limits.maxLimit,
  };
}

function truncateString(value: string, maxLength: number): TruncatedValue {
  if (value.length <= maxLength) {
    return { value, truncated: false };
  }

  if (maxLength <= 3) {
    return { value: value.slice(0, maxLength), truncated: true };
  }

  return {
    value: `${value.slice(0, maxLength - 3)}...`,
    truncated: true,
  };
}

function truncateStringList(
  values: readonly string[],
  maxItems: number,
  maxValueLength: number,
): TruncatedList {
  const items = values
    .slice(0, maxItems)
    .map((value) => truncateString(value, maxValueLength).value);
  const truncatedByCount = values.length > maxItems;
  const truncatedByValue = values
    .slice(0, maxItems)
    .some((value) => value.length > maxValueLength);

  return {
    items,
    truncated: truncatedByCount || truncatedByValue,
  };
}

function toMcpArtifactSummary(
  artifact: ArtifactSummary,
  limits: NormalizedToolLimits,
): { artifact: McpArtifactSummary; truncated: boolean } {
  const title = truncateString(artifact.title, limits.maxTitleLength);
  const summary = truncateString(artifact.summary, limits.maxSummaryLength);
  const tags = truncateStringList(
    artifact.tags,
    limits.maxListItems,
    limits.maxListValueLength,
  );
  const sources = truncateStringList(
    artifact.sources,
    limits.maxListItems,
    limits.maxListValueLength,
  );
  const truncatedFields: TruncatedArtifactField[] = [];

  if (title.truncated) {
    truncatedFields.push('title');
  }
  if (summary.truncated) {
    truncatedFields.push('summary');
  }
  if (tags.truncated) {
    truncatedFields.push('tags');
  }
  if (sources.truncated) {
    truncatedFields.push('sources');
  }

  return {
    artifact: {
      id: artifact.id,
      type: artifact.type,
      title: title.value,
      status: artifact.status,
      scope: artifact.scope,
      summary: summary.value,
      tags: tags.items,
      sources: sources.items,
      created_at: artifact.created_at,
      updated_at: artifact.updated_at,
      relative_path: artifact.relative_path,
      collection: artifact.collection,
      repo: artifact.repo,
      session_id: artifact.session_id,
      severity: artifact.severity,
      language: artifact.language,
      truncated_fields: truncatedFields,
    },
    truncated: truncatedFields.length > 0,
  };
}

function toMcpProvenance(
  provenance: readonly RetrievalProvenance[],
  limits: NormalizedToolLimits,
): { provenance: McpRetrievalProvenance[]; truncated: boolean } {
  const sliced = provenance.slice(0, limits.maxProvenanceItems);
  const formatted = sliced.map((entry) => {
    const value = truncateString(entry.value, limits.maxProvenanceValueLength);
    return {
      field: entry.field,
      match: entry.match,
      value: value.value,
      truncated: value.truncated || undefined,
    };
  });
  const truncatedByValue = sliced.some(
    (entry) => entry.value.length > limits.maxProvenanceValueLength,
  );

  return {
    provenance: formatted,
    truncated: provenance.length > limits.maxProvenanceItems || truncatedByValue,
  };
}

function toMcpMatch(
  match: RetrievalMatch,
  limits: NormalizedToolLimits,
): { match: McpRetrievalMatch; truncated: boolean } {
  const artifact = toMcpArtifactSummary(match.artifact, limits);
  const provenance = toMcpProvenance(match.provenance, limits);

  return {
    match: {
      artifact: artifact.artifact,
      score: match.score,
      provenance: provenance.provenance,
      provenance_truncated: provenance.truncated,
    },
    truncated: artifact.truncated || provenance.truncated,
  };
}

function parseArgs<T>(
  toolName: McpReadToolName,
  schema: ZodType<T>,
  args: unknown,
): T {
  try {
    return schema.parse(args);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new McpToolValidationError(toolName, error);
    }

    throw error;
  }
}

async function loadIndex(options: McpReadServerOptions): Promise<DerivedIndex> {
  if (options.loadIndex) {
    return options.loadIndex();
  }

  if (options.rootDir) {
    return buildDerivedIndex(options.rootDir);
  }

  throw new Error('MCP read server requires either "rootDir" or "loadIndex".');
}

export class MemoryReadMcpServer {
  private readonly limits: NormalizedToolLimits;

  constructor(private readonly options: McpReadServerOptions) {
    this.limits = normalizeToolLimits(options);
  }

  listTools(): readonly McpReadToolDefinition[] {
    return MCP_READ_TOOL_DEFINITIONS;
  }

  async callTool(name: McpReadToolName, args: unknown): Promise<McpReadToolResult> {
    const index = await loadIndex(this.options);

    switch (name) {
      case 'get_repo_conventions':
        return this.handleGetRepoConventions(index, args);
      case 'find_canonical_pattern':
        return this.handleFindCanonicalPattern(index, args);
      case 'find_related_sessions':
        return this.handleFindRelatedSessions(index, args);
      case 'fetch_artifact_summary':
        return this.handleFetchArtifactSummary(index, args);
      default:
        throw new McpToolNotFoundError(name);
    }
  }

  private handleGetRepoConventions(
    index: DerivedIndex,
    args: unknown,
  ): GetRepoConventionsResult {
    const parsed = parseArgs('get_repo_conventions', getRepoConventionsArgsSchema, args);
    const limit = clampLimit(parsed.limit, this.limits);
    const matches = getRepoConventions(index, {
      repo: parsed.repo,
      text: normalizeOptionalString(parsed.text),
      limit: limit.limit,
    });
    const formatted = matches.map((match) => toMcpMatch(match, this.limits));

    return {
      tool: 'get_repo_conventions',
      query: {
        repo: parsed.repo,
        text: normalizeOptionalString(parsed.text),
        limit: limit.limit,
      },
      results: formatted.map((entry) => entry.match),
      result_count: formatted.length,
      truncated: limit.truncated || formatted.some((entry) => entry.truncated),
    };
  }

  private handleFindCanonicalPattern(
    index: DerivedIndex,
    args: unknown,
  ): FindCanonicalPatternResult {
    const parsed = parseArgs(
      'find_canonical_pattern',
      findCanonicalPatternArgsSchema,
      args,
    );
    const match = findCanonicalPattern(index, {
      id: normalizeOptionalString(parsed.id),
      text: normalizeOptionalString(parsed.text),
      repo: normalizeOptionalString(parsed.repo),
    });
    const formatted = match ? toMcpMatch(match, this.limits) : null;

    return {
      tool: 'find_canonical_pattern',
      query: {
        id: normalizeOptionalString(parsed.id),
        text: normalizeOptionalString(parsed.text),
        repo: normalizeOptionalString(parsed.repo),
      },
      match: formatted?.match ?? null,
      truncated: formatted?.truncated ?? false,
    };
  }

  private handleFindRelatedSessions(
    index: DerivedIndex,
    args: unknown,
  ): FindRelatedSessionsResult {
    const parsed = parseArgs(
      'find_related_sessions',
      findRelatedSessionsArgsSchema,
      args,
    );
    const limit = clampLimit(parsed.limit, this.limits);
    const matches = findRelatedSessions(index, {
      text: parsed.text,
      limit: limit.limit,
    });
    const formatted = matches.map((match) => toMcpMatch(match, this.limits));

    return {
      tool: 'find_related_sessions',
      query: {
        text: parsed.text,
        limit: limit.limit,
      },
      results: formatted.map((entry) => entry.match),
      result_count: formatted.length,
      truncated: limit.truncated || formatted.some((entry) => entry.truncated),
    };
  }

  private handleFetchArtifactSummary(
    index: DerivedIndex,
    args: unknown,
  ): FetchArtifactSummaryResult {
    const parsed = parseArgs(
      'fetch_artifact_summary',
      fetchArtifactSummaryArgsSchema,
      args,
    );
    const artifact = fetchArtifactSummary(index, parsed.id);
    const formatted = artifact ? toMcpArtifactSummary(artifact, this.limits) : null;
    const provenance = artifact
      ? toMcpProvenance(
          [{ field: 'id', match: 'exact', value: parsed.id }],
          this.limits,
        )
      : { provenance: [], truncated: false };

    return {
      tool: 'fetch_artifact_summary',
      id: parsed.id,
      found: artifact !== null,
      artifact: formatted?.artifact ?? null,
      provenance: provenance.provenance,
      truncated:
        (formatted?.truncated ?? false) || provenance.truncated,
    };
  }
}

export function createMemoryReadMcpServer(
  options: McpReadServerOptions,
): MemoryReadMcpServer {
  return new MemoryReadMcpServer(options);
}

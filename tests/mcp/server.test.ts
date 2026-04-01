import { afterEach, describe, expect, it } from 'vitest';
import {
  MCP_READ_TOOL_DEFINITIONS,
  McpToolValidationError,
  createMemoryReadMcpServer,
} from '../../src/index.js';
import { createTempMemoryRoot } from '../retrieval/helpers.js';

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) {
    cleanups.pop()?.();
  }
});

describe('MemoryReadMcpServer', () => {
  it('lists the four S05 read-only tools', () => {
    const server = createMemoryReadMcpServer({
      loadIndex: async () => {
        throw new Error('not used in this test');
      },
    });

    expect(server.listTools().map((tool) => tool.name)).toEqual(
      MCP_READ_TOOL_DEFINITIONS.map((tool) => tool.name),
    );
    expect(server.listTools()).toHaveLength(4);
  });

  it('returns bounded repo convention matches with deterministic provenance', async () => {
    const fixture = createTempMemoryRoot(
      Array.from({ length: 6 }, (_, index) => ({
        path: `knowledge/conventions/conv-${index + 1}.md`,
        frontmatter: {
          id: `conv-${index + 1}`,
          type: 'convention',
          title: `Logging convention ${index + 1}`,
          status: 'canonical',
          scope: 'repo',
          repo: 'rag-memory',
          tags: ['logging'],
          summary: `Structured logging rule ${index + 1}.`,
          created_at: '2026-03-31T08:00:00Z',
          updated_at: `2026-03-31T0${index}:00:00Z`,
        },
        body: 'Use structured logging for CLI and MCP responses.',
      })),
    );
    cleanups.push(fixture.cleanup);

    const server = createMemoryReadMcpServer({ rootDir: fixture.rootDir });
    const result = await server.callTool('get_repo_conventions', {
      repo: 'rag-memory',
      text: 'logging',
      limit: 99,
    });

    expect(result.tool).toBe('get_repo_conventions');
    expect(result.query.limit).toBe(5);
    expect(result.result_count).toBe(5);
    expect(result.truncated).toBe(true);
    expect(result.results.every((match) => match.artifact.repo === 'rag-memory')).toBe(
      true,
    );
    expect(result.results[0]?.provenance.length).toBeGreaterThan(0);
  });

  it('marks repo convention results as truncated when extra matches are omitted at the requested limit', async () => {
    const fixture = createTempMemoryRoot(
      Array.from({ length: 6 }, (_, index) => ({
        path: `knowledge/conventions/conv-limit-${index + 1}.md`,
        frontmatter: {
          id: `conv-limit-${index + 1}`,
          type: 'convention',
          title: `Limit convention ${index + 1}`,
          status: 'canonical',
          scope: 'repo',
          repo: 'rag-memory',
          tags: ['logging'],
          summary: `Omitted-match contract check ${index + 1}.`,
          created_at: '2026-03-31T08:00:00Z',
          updated_at: `2026-03-31T1${index}:00:00Z`,
        },
        body: 'Use structured logging for deterministic observability.',
      })),
    );
    cleanups.push(fixture.cleanup);

    const server = createMemoryReadMcpServer({ rootDir: fixture.rootDir });
    const result = await server.callTool('get_repo_conventions', {
      repo: 'rag-memory',
      text: 'logging',
      limit: 5,
    });

    expect(result.result_count).toBe(5);
    expect(result.truncated).toBe(true);
  });

  it('keeps canonical pattern retrieval isolated from historical sessions', async () => {
    const fixture = createTempMemoryRoot([
      {
        path: 'knowledge/patterns/pat-canonical.md',
        frontmatter: {
          id: 'pat-canonical',
          type: 'pattern',
          title: 'Canonical cache invalidation',
          status: 'canonical',
          scope: 'global',
          tags: ['cache'],
          summary: 'Canonical cache invalidation guidance.',
          created_at: '2026-03-31T08:00:00Z',
          updated_at: '2026-03-31T08:00:00Z',
        },
        body: 'Use deterministic invalidation points.',
      },
      {
        path: 'state/sessions/session-cache.md',
        frontmatter: {
          id: 'session-cache',
          type: 'session',
          title: 'Cache invalidation session notes',
          status: 'validated',
          scope: 'repo',
          repo: 'rag-memory',
          session_id: 'sess-cache',
          tags: ['cache'],
          summary: 'Historical notes about cache invalidation.',
          created_at: '2026-03-31T09:00:00Z',
          updated_at: '2026-03-31T09:00:00Z',
        },
        body: 'This should not win canonical pattern retrieval.',
      },
    ]);
    cleanups.push(fixture.cleanup);

    const server = createMemoryReadMcpServer({ rootDir: fixture.rootDir });
    const result = await server.callTool('find_canonical_pattern', {
      text: 'cache invalidation',
    });

    expect(result.tool).toBe('find_canonical_pattern');
    expect(result.match?.artifact.id).toBe('pat-canonical');
    expect(result.match?.artifact.collection).toBe('knowledge');
    expect(result.match?.provenance.length).toBeGreaterThan(0);
  });

  it('truncates oversized session outputs while keeping provenance explicit', async () => {
    const longTitle = 'Session alpha beta gamma delta epsilon zeta '.repeat(4).trim();
    const longSummary = 'summary '.repeat(60).trim();
    const fixture = createTempMemoryRoot([
      {
        path: 'state/sessions/session-long.md',
        frontmatter: {
          id: 'session-long',
          type: 'session',
          title: longTitle,
          status: 'validated',
          scope: 'repo',
          repo: 'rag-memory',
          session_id: 'sess-long',
          tags: Array.from({ length: 8 }, (_, index) => `tag-${index}`),
          sources: Array.from({ length: 8 }, (_, index) => `source-${index}`),
          summary: longSummary,
          created_at: '2026-03-31T10:00:00Z',
          updated_at: '2026-03-31T10:30:00Z',
        },
        body: 'alpha beta gamma delta epsilon zeta',
      },
    ]);
    cleanups.push(fixture.cleanup);

    const server = createMemoryReadMcpServer({ rootDir: fixture.rootDir });
    const result = await server.callTool('find_related_sessions', {
      text: 'alpha beta gamma delta epsilon zeta',
    });

    expect(result.tool).toBe('find_related_sessions');
    expect(result.result_count).toBe(1);
    expect(result.truncated).toBe(true);
    expect(result.results[0]?.artifact.truncated_fields).toEqual(
      expect.arrayContaining(['title', 'summary', 'tags', 'sources']),
    );
    expect(result.results[0]?.provenance_truncated).toBe(true);
  });

  it('fetches one artifact summary by exact id with exact-id provenance', async () => {
    const fixture = createTempMemoryRoot([
      {
        path: 'knowledge/decisions/dec-001.md',
        frontmatter: {
          id: 'dec-001',
          type: 'decision',
          title: 'Adopt local-first index rebuild',
          status: 'validated',
          scope: 'repo',
          repo: 'rag-memory',
          tags: ['index'],
          summary: 'Index rebuild stays local and deterministic.',
          created_at: '2026-03-31T07:00:00Z',
          updated_at: '2026-03-31T07:15:00Z',
        },
        body: 'Decision details for local-first indexing.',
      },
    ]);
    cleanups.push(fixture.cleanup);

    const server = createMemoryReadMcpServer({ rootDir: fixture.rootDir });
    const result = await server.callTool('fetch_artifact_summary', {
      id: 'dec-001',
    });

    expect(result.tool).toBe('fetch_artifact_summary');
    expect(result.found).toBe(true);
    expect(result.artifact?.id).toBe('dec-001');
    expect(result.provenance).toEqual([
      {
        field: 'id',
        match: 'exact',
        value: 'dec-001',
        truncated: undefined,
      },
    ]);
  });

  it('rejects invalid tool arguments deterministically', async () => {
    const server = createMemoryReadMcpServer({
      loadIndex: async () => ({
        rootDir: '/tmp/unused',
        artifacts: [],
        records: [],
        byId: new Map(),
      }),
    });

    await expect(
      server.callTool('find_canonical_pattern', { repo: 'rag-memory' }),
    ).rejects.toBeInstanceOf(McpToolValidationError);
  });

  it('advertises the find_canonical_pattern id-or-text requirement in the tool schema', () => {
    const definition = MCP_READ_TOOL_DEFINITIONS.find(
      (tool) => tool.name === 'find_canonical_pattern',
    );

    expect(definition?.inputSchema).toMatchObject({
      anyOf: [{ required: ['id'] }, { required: ['text'] }],
    });
  });
});

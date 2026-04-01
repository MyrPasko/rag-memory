import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import {
  McpToolValidationError,
  createMemoryMcpServer,
  parseArtifact,
} from '../../src/index.js';
import { createTempMemoryRoot } from '../retrieval/helpers.js';

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) {
    cleanups.pop()?.();
  }
});

describe('MemoryMcpServer write path', () => {
  it('lists the S06 save_session_summary tool alongside the read tools', () => {
    const server = createMemoryMcpServer({
      rootDir: '/tmp/unused',
      loadIndex: async () => ({
        rootDir: '/tmp/unused',
        artifacts: [],
        records: [],
        byId: new Map(),
      }),
    });

    expect(server.listTools().map((tool) => tool.name)).toContain(
      'save_session_summary',
    );
  });

  it('saves a session summary through the MCP write tool', async () => {
    const fixture = createTempMemoryRoot([]);
    cleanups.push(fixture.cleanup);

    const server = createMemoryMcpServer({ rootDir: fixture.rootDir });
    const result = await server.callTool('save_session_summary', {
      id: 'mcp-session-001',
      title: 'MCP session save',
      status: 'validated',
      scope: 'repo',
      repo: 'rag-memory',
      session_id: 'sess-mcp-001',
      summary: 'Persist one session summary through MCP.',
      created_at: '2026-04-01T11:00:00Z',
      updated_at: '2026-04-01T11:05:00Z',
      tags: ['mcp'],
    });

    expect(result.tool).toBe('save_session_summary');
    expect(result.saved).toBe(true);
    expect(result.relative_path).toBe('state/sessions/mcp-session-001.md');
    expect(result.artifact.id).toBe('mcp-session-001');
    expect(result.artifact.collection).toBe('session');

    const parsed = parseArtifact(
      readFileSync(
        `${fixture.rootDir}/state/sessions/mcp-session-001.md`,
        'utf-8',
      ),
    );
    expect(parsed.type).toBe('session');
    expect(parsed.summary).toBe('Persist one session summary through MCP.');
  });

  it('rejects invalid MCP session summary input deterministically', async () => {
    const fixture = createTempMemoryRoot([]);
    cleanups.push(fixture.cleanup);

    const server = createMemoryMcpServer({ rootDir: fixture.rootDir });

    await expect(
      server.callTool('save_session_summary', {
        id: 'missing-repo',
        title: 'Missing repo',
        status: 'validated',
        scope: 'repo',
        session_id: 'sess-missing-repo',
        summary: 'This should fail.',
        created_at: '2026-04-01T11:00:00Z',
        updated_at: '2026-04-01T11:05:00Z',
      }),
    ).rejects.toBeInstanceOf(McpToolValidationError);
  });
});

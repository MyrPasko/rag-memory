import { afterEach, describe, expect, it } from 'vitest';
import { buildDerivedIndex, fetchArtifactSummary, IndexBuildError } from '../../src/index.js';
import { createTempMemoryRoot } from './helpers.js';

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) {
    cleanups.pop()?.();
  }
});

describe('buildDerivedIndex', () => {
  it('rebuilds a local index from knowledge and state files with compact summaries', async () => {
    const fixture = createTempMemoryRoot([
      {
        path: 'knowledge/patterns/pat-retry-loop.md',
        frontmatter: {
          id: 'pat-retry-loop',
          type: 'pattern',
          title: 'Deterministic retry loop',
          status: 'canonical',
          scope: 'global',
          tags: ['retry', 'deterministic'],
          summary: 'Retry failed work with bounded attempts.',
          created_at: '2026-03-30T08:00:00Z',
          updated_at: '2026-03-30T08:00:00Z',
        },
        body: 'Retry failed work with a fixed backoff.',
      },
      {
        path: 'state/sessions/session-001.md',
        frontmatter: {
          id: 'session-001',
          type: 'session',
          title: 'Debugged retrieval ranking',
          status: 'validated',
          scope: 'repo',
          repo: 'rag-memory',
          session_id: 'sess-001',
          tags: ['retrieval'],
          summary: 'Adjusted scoring after ranking drift.',
          created_at: '2026-03-30T09:00:00Z',
          updated_at: '2026-03-30T09:15:00Z',
        },
        body: 'Observed ranking drift in the local search flow.',
      },
    ]);
    cleanups.push(fixture.cleanup);

    const index = await buildDerivedIndex(fixture.rootDir);

    expect(index.artifacts).toHaveLength(2);

    const pattern = fetchArtifactSummary(index, 'pat-retry-loop');
    expect(pattern).not.toBeNull();
    expect(pattern?.relative_path).toBe('knowledge/patterns/pat-retry-loop.md');
    expect(pattern?.collection).toBe('knowledge');
    expect(pattern).not.toHaveProperty('body');

    const session = fetchArtifactSummary(index, 'session-001');
    expect(session).not.toBeNull();
    expect(session?.relative_path).toBe('state/sessions/session-001.md');
    expect(session?.collection).toBe('session');
    expect(session?.session_id).toBe('sess-001');
  });

  it('fails deterministically when a file lives in the wrong artifact folder', async () => {
    const fixture = createTempMemoryRoot([
      {
        path: 'knowledge/patterns/not-a-pattern.md',
        frontmatter: {
          id: 'session-misplaced',
          type: 'session',
          title: 'Misplaced session artifact',
          status: 'validated',
          scope: 'repo',
          repo: 'rag-memory',
          session_id: 'sess-misplaced',
          tags: ['session'],
          summary: 'This file should not live under knowledge/patterns.',
          created_at: '2026-03-30T09:00:00Z',
          updated_at: '2026-03-30T09:15:00Z',
        },
        body: 'A session artifact placed under a pattern folder.',
      },
    ]);
    cleanups.push(fixture.cleanup);

    await expect(buildDerivedIndex(fixture.rootDir)).rejects.toBeInstanceOf(
      IndexBuildError,
    );
  });
});

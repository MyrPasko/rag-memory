import { afterEach, describe, expect, it } from 'vitest';
import {
  buildDerivedIndex,
  findCanonicalPattern,
  findRelatedSessions,
  getRepoConventions,
} from '../../src/index.js';
import { createTempMemoryRoot } from './helpers.js';

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) {
    cleanups.pop()?.();
  }
});

describe('deterministic retrieval core', () => {
  it('ranks exact identifiers above loose text matches', async () => {
    const fixture = createTempMemoryRoot([
      {
        path: 'knowledge/patterns/pat-exact-id.md',
        frontmatter: {
          id: 'pat-exact-id',
          type: 'pattern',
          title: 'Steady retry policy',
          status: 'canonical',
          scope: 'global',
          tags: ['retry'],
          summary: 'Reference pattern for retry behavior.',
          created_at: '2026-03-30T08:00:00Z',
          updated_at: '2026-03-30T08:00:00Z',
        },
        body: 'Reference material for retry handling.',
      },
      {
        path: 'knowledge/patterns/pat-loose-match.md',
        frontmatter: {
          id: 'pat-loose-match',
          type: 'pattern',
          title: 'Pattern mentioning pat-exact-id',
          status: 'canonical',
          scope: 'global',
          tags: ['retry'],
          summary: 'This summary mentions pat-exact-id but is not the exact artifact.',
          created_at: '2026-03-30T08:05:00Z',
          updated_at: '2026-03-30T08:05:00Z',
        },
        body: 'Loose match body for pat-exact-id.',
      },
    ]);
    cleanups.push(fixture.cleanup);

    const index = await buildDerivedIndex(fixture.rootDir);
    const match = findCanonicalPattern(index, { text: 'pat-exact-id' });

    expect(match?.artifact.id).toBe('pat-exact-id');
    expect(match?.provenance).toContainEqual({
      field: 'id',
      match: 'exact',
      value: 'pat-exact-id',
    });
  });

  it('keeps canonical pattern retrieval canonical and isolated from sessions', async () => {
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
          summary: 'Canonical guidance for cache invalidation.',
          created_at: '2026-03-30T08:00:00Z',
          updated_at: '2026-03-30T08:00:00Z',
        },
        body: 'Use deterministic invalidation points for cached data.',
      },
      {
        path: 'knowledge/patterns/pat-non-canonical.md',
        frontmatter: {
          id: 'pat-non-canonical',
          type: 'pattern',
          title: 'Cache invalidation playbook',
          status: 'validated',
          scope: 'global',
          tags: ['cache'],
          summary: 'Validated but not canonical cache guidance.',
          created_at: '2026-03-30T09:00:00Z',
          updated_at: '2026-03-30T09:00:00Z',
        },
        body: 'This validated artifact should not appear in canonical retrieval.',
      },
      {
        path: 'state/sessions/session-cache.md',
        frontmatter: {
          id: 'session-cache',
          type: 'session',
          title: 'Session notes on cache invalidation',
          status: 'validated',
          scope: 'repo',
          repo: 'rag-memory',
          session_id: 'sess-cache',
          tags: ['cache'],
          summary: 'Historical notes about cache invalidation.',
          created_at: '2026-03-30T10:00:00Z',
          updated_at: '2026-03-30T10:00:00Z',
        },
        body: 'This session should stay isolated from canonical pattern retrieval.',
      },
    ]);
    cleanups.push(fixture.cleanup);

    const index = await buildDerivedIndex(fixture.rootDir);
    const canonical = findCanonicalPattern(index, { text: 'cache invalidation' });
    const sessions = findRelatedSessions(index, { text: 'cache invalidation' });

    expect(canonical?.artifact.id).toBe('pat-canonical');
    expect(sessions.map((match) => match.artifact.id)).toEqual(['session-cache']);
  });

  it('returns repo-scoped conventions with stable limits and provenance', async () => {
    const fixture = createTempMemoryRoot([
      {
        path: 'knowledge/conventions/conv-a.md',
        frontmatter: {
          id: 'conv-a',
          type: 'convention',
          title: 'Repo logging convention',
          status: 'canonical',
          scope: 'repo',
          repo: 'rag-memory',
          tags: ['logging'],
          summary: 'Use structured JSON logs for CLI and MCP flows.',
          created_at: '2026-03-30T08:00:00Z',
          updated_at: '2026-03-30T12:00:00Z',
        },
        body: 'Structured logging keeps the retrieval pipeline observable.',
      },
      {
        path: 'knowledge/conventions/conv-b.md',
        frontmatter: {
          id: 'conv-b',
          type: 'convention',
          title: 'Repo tracing convention',
          status: 'validated',
          scope: 'repo',
          repo: 'rag-memory',
          tags: ['logging', 'tracing'],
          summary: 'Emit trace identifiers in command output.',
          created_at: '2026-03-30T08:00:00Z',
          updated_at: '2026-03-30T11:00:00Z',
        },
        body: 'Trace identifiers simplify provenance checks.',
      },
      {
        path: 'knowledge/conventions/conv-other-repo.md',
        frontmatter: {
          id: 'conv-other-repo',
          type: 'convention',
          title: 'Other repo convention',
          status: 'canonical',
          scope: 'repo',
          repo: 'another-repo',
          tags: ['logging'],
          summary: 'Should not leak into rag-memory retrieval.',
          created_at: '2026-03-30T08:00:00Z',
          updated_at: '2026-03-30T12:00:00Z',
        },
        body: 'This convention belongs to another repository.',
      },
    ]);
    cleanups.push(fixture.cleanup);

    const index = await buildDerivedIndex(fixture.rootDir);
    const matches = getRepoConventions(index, {
      repo: 'rag-memory',
      text: 'logging',
      limit: 2,
    });

    expect(matches).toHaveLength(2);
    expect(matches.map((match) => match.artifact.id)).toEqual(['conv-a', 'conv-b']);
    expect(matches[0]?.artifact.relative_path).toBe(
      'knowledge/conventions/conv-a.md',
    );
    expect(matches[0]?.provenance.length).toBeGreaterThan(0);
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import {
  buildDerivedIndex,
  fetchArtifactSummary,
  parseArtifact,
  saveSessionSummary,
  SaveSessionSummaryError,
} from '../../src/index.js';
import { createTempMemoryRoot } from '../retrieval/helpers.js';

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) {
    cleanups.pop()?.();
  }
});

describe('saveSessionSummary', () => {
  it('persists a validated session summary into deterministic local storage', async () => {
    const fixture = createTempMemoryRoot([]);
    cleanups.push(fixture.cleanup);

    const saved = await saveSessionSummary(fixture.rootDir, {
      id: 'session-001',
      title: 'Document retrieval regression',
      status: 'validated',
      scope: 'repo',
      repo: 'rag-memory',
      session_id: 'sess-001',
      tags: ['retrieval', 'Regression'],
      summary: 'Documented retrieval regression handling.',
      created_at: '2026-04-01T08:00:00Z',
      updated_at: '2026-04-01T08:15:00Z',
    });

    expect(saved.created).toBe(true);
    expect(saved.relativePath).toBe('state/sessions/session-001.md');
    expect(saved.summary.collection).toBe('session');
    expect(saved.summary.session_id).toBe('sess-001');

    const parsed = parseArtifact(readFileSync(saved.absolutePath, 'utf-8'));
    expect(parsed.type).toBe('session');
    expect(parsed.body).toBe('Documented retrieval regression handling.');
    expect(parsed.tags).toEqual(['retrieval', 'regression']);

    const index = await buildDerivedIndex(fixture.rootDir);
    expect(fetchArtifactSummary(index, 'session-001')?.relative_path).toBe(
      'state/sessions/session-001.md',
    );
  });

  it('overwrites the same deterministic file when the session id is reused', async () => {
    const fixture = createTempMemoryRoot([]);
    cleanups.push(fixture.cleanup);

    const first = await saveSessionSummary(fixture.rootDir, {
      id: 'session-overwrite',
      title: 'First version',
      status: 'draft',
      scope: 'ticket',
      session_id: 'sess-overwrite',
      summary: 'Initial summary.',
      body: 'Initial body.',
      created_at: '2026-04-01T09:00:00Z',
      updated_at: '2026-04-01T09:00:00Z',
    });
    const second = await saveSessionSummary(fixture.rootDir, {
      id: 'session-overwrite',
      title: 'Second version',
      status: 'validated',
      scope: 'ticket',
      session_id: 'sess-overwrite',
      summary: 'Updated summary.',
      body: 'Updated body.',
      created_at: '2026-04-01T09:00:00Z',
      updated_at: '2026-04-01T09:30:00Z',
    });

    expect(first.relativePath).toBe(second.relativePath);
    expect(second.created).toBe(false);
    expect(readFileSync(second.absolutePath, 'utf-8')).toContain('Updated summary.');
  });

  it('fails validation when repo-scoped session summaries omit repo', async () => {
    const fixture = createTempMemoryRoot([]);
    cleanups.push(fixture.cleanup);

    await expect(
      saveSessionSummary(fixture.rootDir, {
        id: 'session-missing-repo',
        title: 'Missing repo',
        status: 'validated',
        scope: 'repo',
        session_id: 'sess-missing-repo',
        summary: 'This should fail validation.',
        created_at: '2026-04-01T10:00:00Z',
        updated_at: '2026-04-01T10:00:00Z',
      }),
    ).rejects.toBeInstanceOf(SaveSessionSummaryError);
  });
});

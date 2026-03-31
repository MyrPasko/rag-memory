import { describe, it, expect } from 'vitest';
import {
  getArtifactFolder,
  isSessionKind,
  isKnowledgeKind,
} from '../../src/schema/file-contract.js';
import type { ArtifactKind } from '../../src/schema/kinds.js';

describe('getArtifactFolder', () => {
  it('maps pattern to knowledge/patterns', () => {
    expect(getArtifactFolder('pattern')).toBe('knowledge/patterns');
  });

  it('maps convention to knowledge/conventions', () => {
    expect(getArtifactFolder('convention')).toBe('knowledge/conventions');
  });

  it('maps decision to knowledge/decisions', () => {
    expect(getArtifactFolder('decision')).toBe('knowledge/decisions');
  });

  it('maps session to state/sessions', () => {
    expect(getArtifactFolder('session')).toBe('state/sessions');
  });

  it('maps incident to knowledge/incidents', () => {
    expect(getArtifactFolder('incident')).toBe('knowledge/incidents');
  });

  it('maps snippet to knowledge/snippets', () => {
    expect(getArtifactFolder('snippet')).toBe('knowledge/snippets');
  });

  it('returns distinct folders for each kind', () => {
    const kinds: ArtifactKind[] = [
      'pattern',
      'convention',
      'decision',
      'session',
      'incident',
      'snippet',
    ];
    const folders = kinds.map(getArtifactFolder);
    const unique = new Set(folders);
    expect(unique.size).toBe(kinds.length);
  });

  it('session folder is under state/ not knowledge/', () => {
    expect(getArtifactFolder('session')).toMatch(/^state\//);
  });

  it('all non-session folders are under knowledge/', () => {
    const knowledgeKinds: ArtifactKind[] = [
      'pattern',
      'convention',
      'decision',
      'incident',
      'snippet',
    ];
    for (const kind of knowledgeKinds) {
      expect(getArtifactFolder(kind)).toMatch(/^knowledge\//);
    }
  });
});

describe('isSessionKind', () => {
  it('returns true for session', () => {
    expect(isSessionKind('session')).toBe(true);
  });

  it('returns false for pattern', () => {
    expect(isSessionKind('pattern')).toBe(false);
  });

  it('returns false for all non-session kinds', () => {
    const nonSession: ArtifactKind[] = [
      'pattern',
      'convention',
      'decision',
      'incident',
      'snippet',
    ];
    for (const kind of nonSession) {
      expect(isSessionKind(kind)).toBe(false);
    }
  });
});

describe('isKnowledgeKind', () => {
  it('returns true for pattern', () => {
    expect(isKnowledgeKind('pattern')).toBe(true);
  });

  it('returns true for all non-session kinds', () => {
    const knowledgeKinds: ArtifactKind[] = [
      'pattern',
      'convention',
      'decision',
      'incident',
      'snippet',
    ];
    for (const kind of knowledgeKinds) {
      expect(isKnowledgeKind(kind)).toBe(true);
    }
  });

  it('returns false for session', () => {
    expect(isKnowledgeKind('session')).toBe(false);
  });
});

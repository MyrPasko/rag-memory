import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { parseArtifact } from '../../src/schema/parse.js';
import { ParseArtifactError } from '../../src/schema/errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = resolve(__dirname, '../../fixtures');

function readFixture(relPath: string): string {
  return readFileSync(resolve(fixturesDir, relPath), 'utf-8');
}

describe('parseArtifact – valid fixtures', () => {
  it('parses pattern-basic.md into a canonical PatternArtifact', () => {
    const raw = readFixture('valid/pattern-basic.md');
    const artifact = parseArtifact(raw);
    expect(artifact.type).toBe('pattern');
    expect(artifact.id).toBe('pat-001');
    expect(artifact.status).toBe('canonical');
    expect(artifact.scope).toBe('global');
    expect(artifact.tags).toEqual(['architecture', 'data-access']);
    expect(typeof artifact.summary).toBe('string');
    expect(artifact.summary.length).toBeGreaterThan(0);
    expect(artifact.sources).toEqual([]);
    expect(artifact.supersedes).toEqual([]);
  });

  it('parses convention-basic.md and enforces scope=repo with repo field', () => {
    const raw = readFixture('valid/convention-basic.md');
    const artifact = parseArtifact(raw);
    expect(artifact.type).toBe('convention');
    expect(artifact.scope).toBe('repo');
    expect(artifact.repo).toBe('rag-memory');
  });

  it('parses decision-basic.md into a canonical DecisionArtifact', () => {
    const raw = readFixture('valid/decision-basic.md');
    const artifact = parseArtifact(raw);
    expect(artifact.type).toBe('decision');
    expect(artifact.id).toBe('dec-001');
    expect(artifact.status).toBe('canonical');
  });

  it('parses session-basic.md and includes session_id', () => {
    const raw = readFixture('valid/session-basic.md');
    const artifact = parseArtifact(raw);
    expect(artifact.type).toBe('session');
    if (artifact.type === 'session') {
      expect(artifact.session_id).toBe('session-2024-03-01-001');
    }
  });

  it('parses incident-basic.md and includes severity', () => {
    const raw = readFixture('valid/incident-basic.md');
    const artifact = parseArtifact(raw);
    expect(artifact.type).toBe('incident');
    if (artifact.type === 'incident') {
      expect(artifact.severity).toBe('medium');
    }
  });

  it('parses snippet-basic.md and includes language', () => {
    const raw = readFixture('valid/snippet-basic.md');
    const artifact = parseArtifact(raw);
    expect(artifact.type).toBe('snippet');
    if (artifact.type === 'snippet') {
      expect(artifact.language).toBe('typescript');
    }
  });

  it('normalizes all valid artifacts into the canonical model with default arrays', () => {
    const fixtures = [
      'valid/pattern-basic.md',
      'valid/convention-basic.md',
      'valid/decision-basic.md',
      'valid/session-basic.md',
      'valid/incident-basic.md',
      'valid/snippet-basic.md',
    ];
    for (const fixture of fixtures) {
      const artifact = parseArtifact(readFixture(fixture));
      expect(Array.isArray(artifact.tags)).toBe(true);
      expect(Array.isArray(artifact.sources)).toBe(true);
      expect(Array.isArray(artifact.supersedes)).toBe(true);
      expect(typeof artifact.body).toBe('string');
    }
  });

  it('normalizes tags to lowercase unique values', () => {
    const raw = `---
id: pat-tag-normalization
type: pattern
title: Tag Normalization
status: canonical
scope: global
tags:
  - API
  - api
  - GraphQL
  - graphql
summary: Ensures tag normalization is canonical.
created_at: "2024-06-01T00:00:00.000Z"
updated_at: "2024-06-01T00:00:00.000Z"
---

Tag normalization fixture body.
`;

    const artifact = parseArtifact(raw);
    expect(artifact.tags).toEqual(['api', 'graphql']);
  });
});

describe('parseArtifact – invalid fixtures', () => {
  it('throws ParseArtifactError for missing-type.md', () => {
    const raw = readFixture('invalid/missing-type.md');
    expect(() => parseArtifact(raw)).toThrowError(ParseArtifactError);
  });

  it('throws ParseArtifactError for bad-type.md', () => {
    const raw = readFixture('invalid/bad-type.md');
    expect(() => parseArtifact(raw)).toThrowError(ParseArtifactError);
  });

  it('throws ParseArtifactError for missing-summary.md', () => {
    const raw = readFixture('invalid/missing-summary.md');
    expect(() => parseArtifact(raw)).toThrowError(ParseArtifactError);
  });

  it('throws ParseArtifactError for session-missing-session-id.md', () => {
    const raw = readFixture('invalid/session-missing-session-id.md');
    expect(() => parseArtifact(raw)).toThrowError(ParseArtifactError);
  });

  it('throws ParseArtifactError for incident-bad-severity.md', () => {
    const raw = readFixture('invalid/incident-bad-severity.md');
    expect(() => parseArtifact(raw)).toThrowError(ParseArtifactError);
  });

  it('includes a descriptive message on validation failure', () => {
    const raw = readFixture('invalid/missing-type.md');
    let caught: unknown;
    try {
      parseArtifact(raw);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ParseArtifactError);
    expect((caught as ParseArtifactError).message).toMatch(/Invalid artifact/);
  });

  it('exposes the Zod error as cause on validation failure', () => {
    const raw = readFixture('invalid/bad-type.md');
    let caught: unknown;
    try {
      parseArtifact(raw);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ParseArtifactError);
    expect((caught as ParseArtifactError).cause).toBeDefined();
  });
});

import { readdir, readFile } from 'fs/promises';
import { join, relative, sep } from 'path';
import {
  ARTIFACT_KINDS,
  getArtifactFolder,
  isSessionKind,
  parseArtifact,
} from '../schema/index.js';
import { IndexBuildError } from './errors.js';
import type {
  ArtifactCollection,
  ArtifactSummary,
  DerivedIndex,
  IndexedArtifactRecord,
} from './types.js';

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizePath(rootDir: string, filePath: string): string {
  return relative(rootDir, filePath).split(sep).join('/');
}

async function listMarkdownFiles(dirPath: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dirPath, { withFileTypes: true });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return [];
    }

    throw new IndexBuildError(`Failed to read directory: ${dirPath}`, error);
  }

  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        return listMarkdownFiles(entryPath);
      }
      if (entry.isFile() && entry.name.endsWith('.md')) {
        return [entryPath];
      }
      return [];
    }),
  );

  return nestedFiles.flat().sort();
}

function toArtifactSummary(
  relativePath: string,
  artifact: IndexedArtifactRecord['artifact'],
  collection: ArtifactCollection,
): ArtifactSummary {
  return {
    id: artifact.id,
    type: artifact.type,
    title: artifact.title,
    status: artifact.status,
    scope: artifact.scope,
    summary: artifact.summary,
    tags: [...artifact.tags],
    sources: [...artifact.sources],
    created_at: artifact.created_at,
    updated_at: artifact.updated_at,
    relative_path: relativePath,
    collection,
    repo: artifact.repo,
    session_id: artifact.type === 'session' ? artifact.session_id : undefined,
    severity: artifact.type === 'incident' ? artifact.severity : undefined,
    language: artifact.type === 'snippet' ? artifact.language : undefined,
  };
}

async function buildKindRecords(
  rootDir: string,
  kind: (typeof ARTIFACT_KINDS)[number],
): Promise<IndexedArtifactRecord[]> {
  const collection: ArtifactCollection = isSessionKind(kind)
    ? 'session'
    : 'knowledge';
  const folderPath = join(rootDir, getArtifactFolder(kind));
  const files = await listMarkdownFiles(folderPath);

  return Promise.all(
    files.map(async (filePath) => {
      const raw = await readFile(filePath, 'utf-8');
      const artifact = parseArtifact(raw);
      const relativePath = normalizePath(rootDir, filePath);

      if (artifact.type !== kind) {
        throw new IndexBuildError(
          `Artifact type mismatch in ${relativePath}: expected ${kind}, got ${artifact.type}`,
        );
      }

      return {
        artifact,
        summary: toArtifactSummary(relativePath, artifact, collection),
        searchable: {
          id: normalizeText(artifact.id),
          title: normalizeText(artifact.title),
          summary: normalizeText(artifact.summary),
          body: normalizeText(artifact.body),
          tags: artifact.tags.map(normalizeText),
          repo: normalizeText(artifact.repo ?? ''),
          session_id:
            artifact.type === 'session'
              ? normalizeText(artifact.session_id)
              : '',
        },
      };
    }),
  );
}

function buildRecordMap(
  records: IndexedArtifactRecord[],
): Map<string, IndexedArtifactRecord> {
  const byId = new Map<string, IndexedArtifactRecord>();

  for (const record of records) {
    const normalizedId = normalizeText(record.summary.id);
    const existing = byId.get(normalizedId);

    if (existing) {
      throw new IndexBuildError(
        `Duplicate artifact id "${record.summary.id}" found in ${existing.summary.relative_path} and ${record.summary.relative_path}`,
      );
    }

    byId.set(normalizedId, record);
  }

  return byId;
}

export async function buildDerivedIndex(rootDir: string): Promise<DerivedIndex> {
  const recordGroups = await Promise.all(
    ARTIFACT_KINDS.map((kind) => buildKindRecords(rootDir, kind)),
  );
  const records = recordGroups
    .flat()
    .sort((left, right) => left.summary.id.localeCompare(right.summary.id));
  const byId = buildRecordMap(records);

  return {
    rootDir,
    artifacts: records.map((record) => record.summary),
    records,
    byId,
  };
}

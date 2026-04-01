import matter from 'gray-matter';
import { access, mkdir, writeFile } from 'fs/promises';
import { join, relative, sep } from 'path';
import { getArtifactFolder, normalizeRaw } from '../schema/index.js';
import { ArtifactSchema } from '../schema/schema.js';
import type { SessionArtifact } from '../schema/index.js';
import type { ArtifactSummary } from '../retrieval/types.js';

export interface SaveSessionSummaryInput {
  id: string;
  title: string;
  status: SessionArtifact['status'];
  scope: SessionArtifact['scope'];
  repo?: string;
  session_id: string;
  tags?: string[];
  summary: string;
  body?: string;
  created_at: string;
  updated_at: string;
  sources?: string[];
  supersedes?: string[];
}

export interface SavedSessionSummary {
  artifact: SessionArtifact;
  absolutePath: string;
  relativePath: string;
  summary: ArtifactSummary;
  created: boolean;
}

export class SaveSessionSummaryError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'SaveSessionSummaryError';
  }
}

function normalizePath(rootDir: string, filePath: string): string {
  return relative(rootDir, filePath).split(sep).join('/');
}

function toSessionFileName(id: string): string {
  const normalizedId = id.trim();
  if (!normalizedId) {
    throw new SaveSessionSummaryError('Session id must not be empty.');
  }

  return `${encodeURIComponent(normalizedId)}.md`;
}

function toSessionArtifact(input: SaveSessionSummaryInput): SessionArtifact {
  const normalized = normalizeRaw(
    {
      id: input.id,
      type: 'session',
      title: input.title,
      status: input.status,
      scope: input.scope,
      repo: input.repo,
      session_id: input.session_id,
      tags: input.tags ?? [],
      summary: input.summary,
      created_at: input.created_at,
      updated_at: input.updated_at,
      sources: input.sources ?? [],
      supersedes: input.supersedes ?? [],
    },
    input.body ?? input.summary,
  );

  const result = ArtifactSchema.safeParse(normalized);
  if (!result.success || result.data.type !== 'session') {
    throw new SaveSessionSummaryError(
      `Invalid session summary: ${result.success ? 'artifact type mismatch' : result.error.issues.map((issue) => issue.message).join('; ')}`,
      result.success ? undefined : result.error,
    );
  }

  return result.data;
}

function renderSessionArtifact(artifact: SessionArtifact): string {
  const frontmatter: Record<string, unknown> = {
    id: artifact.id,
    type: artifact.type,
    title: artifact.title,
    status: artifact.status,
    scope: artifact.scope,
  };

  if (artifact.repo) {
    frontmatter['repo'] = artifact.repo;
  }

  frontmatter['session_id'] = artifact.session_id;
  frontmatter['tags'] = artifact.tags;
  frontmatter['summary'] = artifact.summary;
  frontmatter['created_at'] = artifact.created_at;
  frontmatter['updated_at'] = artifact.updated_at;
  frontmatter['sources'] = artifact.sources;
  frontmatter['supersedes'] = artifact.supersedes;

  const rendered = matter.stringify(artifact.body, frontmatter).trimEnd();
  return `${rendered}\n`;
}

function toArtifactSummary(
  artifact: SessionArtifact,
  relativePath: string,
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
    collection: 'session',
    repo: artifact.repo,
    session_id: artifact.session_id,
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return false;
    }

    throw error;
  }
}

export async function saveSessionSummary(
  rootDir: string,
  input: SaveSessionSummaryInput,
): Promise<SavedSessionSummary> {
  const artifact = toSessionArtifact(input);
  const folderPath = join(rootDir, getArtifactFolder('session'));
  const filePath = join(folderPath, toSessionFileName(artifact.id));
  const existed = await fileExists(filePath);

  try {
    await mkdir(folderPath, { recursive: true });
    await writeFile(filePath, renderSessionArtifact(artifact), 'utf-8');
  } catch (error) {
    throw new SaveSessionSummaryError(
      `Failed to persist session summary at ${filePath}`,
      error,
    );
  }

  const relativePath = normalizePath(rootDir, filePath);

  return {
    artifact,
    absolutePath: filePath,
    relativePath,
    summary: toArtifactSummary(artifact, relativePath),
    created: !existed,
  };
}

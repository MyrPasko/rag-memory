import matter from 'gray-matter';
import { ArtifactSchema } from './schema.js';
import { normalizeRaw } from './normalize.js';
import { ParseArtifactError } from './errors.js';
import type { Artifact } from './schema.js';

export function parseArtifact(rawMarkdown: string): Artifact {
  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(rawMarkdown);
  } catch (err) {
    throw new ParseArtifactError('Failed to parse frontmatter', err);
  }

  const normalized = normalizeRaw(
    parsed.data as Record<string, unknown>,
    parsed.content,
  );

  const result = ArtifactSchema.safeParse(normalized);
  if (!result.success) {
    throw new ParseArtifactError(
      `Invalid artifact: ${result.error.issues.map((i) => i.message).join('; ')}`,
      result.error,
    );
  }

  return result.data;
}

import type { ArtifactKind } from './kinds.js';

const KIND_TO_FOLDER: Record<ArtifactKind, string> = {
  pattern: 'knowledge/patterns',
  convention: 'knowledge/conventions',
  decision: 'knowledge/decisions',
  session: 'state/sessions',
  incident: 'knowledge/incidents',
  snippet: 'knowledge/snippets',
};

export function getArtifactFolder(kind: ArtifactKind): string {
  return KIND_TO_FOLDER[kind];
}

export function isSessionKind(kind: ArtifactKind): kind is 'session' {
  return kind === 'session';
}

export function isKnowledgeKind(
  kind: ArtifactKind,
): kind is Exclude<ArtifactKind, 'session'> {
  return kind !== 'session';
}

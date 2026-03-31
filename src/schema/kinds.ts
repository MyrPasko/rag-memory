export const ARTIFACT_KINDS = [
  'pattern',
  'convention',
  'decision',
  'session',
  'incident',
  'snippet',
] as const;

export type ArtifactKind = (typeof ARTIFACT_KINDS)[number];

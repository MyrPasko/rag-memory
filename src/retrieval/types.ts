import type {
  Artifact,
  ArtifactKind,
  ArtifactScope,
  ArtifactStatus,
  IncidentSeverity,
} from '../schema/index.js';

export type ArtifactCollection = 'knowledge' | 'session';

export interface ArtifactSummary {
  id: string;
  type: ArtifactKind;
  title: string;
  status: ArtifactStatus;
  scope: ArtifactScope;
  summary: string;
  tags: string[];
  sources: string[];
  created_at: string;
  updated_at: string;
  relative_path: string;
  collection: ArtifactCollection;
  repo?: string;
  session_id?: string;
  severity?: IncidentSeverity;
  language?: string;
}

export interface IndexedArtifactRecord {
  artifact: Artifact;
  summary: ArtifactSummary;
  searchable: {
    id: string;
    title: string;
    summary: string;
    body: string;
    tags: string[];
    repo: string;
    session_id: string;
  };
}

export interface DerivedIndex {
  rootDir: string;
  artifacts: readonly ArtifactSummary[];
  records: readonly IndexedArtifactRecord[];
  byId: ReadonlyMap<string, IndexedArtifactRecord>;
}

export interface RetrievalProvenance {
  field: 'id' | 'session_id' | 'title' | 'tag' | 'summary' | 'body';
  match: 'exact' | 'contains' | 'token';
  value: string;
}

export interface RetrievalMatch {
  artifact: ArtifactSummary;
  score: number;
  provenance: RetrievalProvenance[];
}

export interface CanonicalPatternQuery {
  id?: string;
  text?: string;
  repo?: string;
}

export interface RepoConventionsQuery {
  repo: string;
  text?: string;
  limit?: number;
}

export interface RelatedSessionsQuery {
  text: string;
  limit?: number;
}

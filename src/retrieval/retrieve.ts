import type {
  CanonicalPatternQuery,
  DerivedIndex,
  IndexedArtifactRecord,
  RelatedSessionsQuery,
  RepoConventionsQuery,
  RetrievalMatch,
  RetrievalProvenance,
} from './types.js';

const STATUS_RANK: Record<string, number> = {
  canonical: 4,
  validated: 3,
  draft: 2,
  deprecated: 1,
};

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function tokenize(value: string): string[] {
  return Array.from(
    new Set(
      normalizeText(value)
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean),
    ),
  );
}

function pushProvenance(
  provenance: RetrievalProvenance[],
  field: RetrievalProvenance['field'],
  match: RetrievalProvenance['match'],
  value: string,
): void {
  const existing = provenance.find(
    (item) => item.field === field && item.match === match && item.value === value,
  );
  if (!existing) {
    provenance.push({ field, match, value });
  }
}

function scoreRecord(
  record: IndexedArtifactRecord,
  rawQuery: string,
): RetrievalMatch | null {
  const query = normalizeText(rawQuery);
  if (!query) {
    return null;
  }

  const tokens = tokenize(query);
  let score = 0;
  const provenance: RetrievalProvenance[] = [];

  if (record.searchable.id === query) {
    score += 1_000;
    pushProvenance(provenance, 'id', 'exact', rawQuery);
  }
  if (record.searchable.session_id === query) {
    score += 950;
    pushProvenance(provenance, 'session_id', 'exact', rawQuery);
  }
  if (record.searchable.title === query) {
    score += 850;
    pushProvenance(provenance, 'title', 'exact', rawQuery);
  }
  if (record.searchable.tags.includes(query)) {
    score += 800;
    pushProvenance(provenance, 'tag', 'exact', rawQuery);
  }
  if (record.searchable.title.includes(query) && record.searchable.title !== query) {
    score += 220;
    pushProvenance(provenance, 'title', 'contains', rawQuery);
  }
  if (record.searchable.summary.includes(query)) {
    score += 180;
    pushProvenance(provenance, 'summary', 'contains', rawQuery);
  }
  if (record.searchable.body.includes(query)) {
    score += 120;
    pushProvenance(provenance, 'body', 'contains', rawQuery);
  }

  for (const token of tokens) {
    if (record.searchable.title.includes(token)) {
      score += 35;
      pushProvenance(provenance, 'title', 'token', token);
    }
    if (record.searchable.tags.some((tag) => tag.includes(token))) {
      score += 30;
      pushProvenance(provenance, 'tag', 'token', token);
    }
    if (record.searchable.summary.includes(token)) {
      score += 20;
      pushProvenance(provenance, 'summary', 'token', token);
    }
    if (record.searchable.body.includes(token)) {
      score += 10;
      pushProvenance(provenance, 'body', 'token', token);
    }
  }

  if (score === 0) {
    return null;
  }

  return {
    artifact: record.summary,
    score,
    provenance,
  };
}

function compareMatches(left: RetrievalMatch, right: RetrievalMatch): number {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  const leftStatus = STATUS_RANK[left.artifact.status] ?? 0;
  const rightStatus = STATUS_RANK[right.artifact.status] ?? 0;
  if (rightStatus !== leftStatus) {
    return rightStatus - leftStatus;
  }

  const updatedAt = right.artifact.updated_at.localeCompare(left.artifact.updated_at);
  if (updatedAt !== 0) {
    return updatedAt;
  }

  return left.artifact.id.localeCompare(right.artifact.id);
}

function rankRecords(
  records: IndexedArtifactRecord[],
  query: string | undefined,
  limit: number,
): RetrievalMatch[] {
  const normalizedLimit = Math.max(1, limit);
  if (!query || !normalizeText(query)) {
    return records
      .map((record) => ({
        artifact: record.summary,
        score: 0,
        provenance: [] as RetrievalProvenance[],
      }))
      .sort(compareMatches)
      .slice(0, normalizedLimit);
  }

  return records
    .map((record) => scoreRecord(record, query))
    .filter((match): match is RetrievalMatch => match !== null)
    .sort(compareMatches)
    .slice(0, normalizedLimit);
}

export function fetchArtifactSummary(
  index: DerivedIndex,
  id: string,
): RetrievalMatch['artifact'] | null {
  const record = index.byId.get(normalizeText(id));
  return record?.summary ?? null;
}

export function findCanonicalPattern(
  index: DerivedIndex,
  query: CanonicalPatternQuery,
): RetrievalMatch | null {
  const records = index.records.filter(
    (record) =>
      record.summary.collection === 'knowledge' &&
      record.summary.type === 'pattern' &&
      record.summary.status === 'canonical' &&
      (!query.repo || record.searchable.repo === normalizeText(query.repo)),
  );

  if (query.id) {
    const exactId = query.id;
    const exact = records.find(
      (record) => record.searchable.id === normalizeText(exactId),
    );
    if (exact) {
      return {
        artifact: exact.summary,
        score: 1_000,
        provenance: [{ field: 'id', match: 'exact', value: exactId }],
      };
    }
  }

  const ranked = rankRecords(records, query.text ?? query.id, 1);
  return ranked[0] ?? null;
}

export function getRepoConventions(
  index: DerivedIndex,
  query: RepoConventionsQuery,
): RetrievalMatch[] {
  const records = index.records.filter(
    (record) =>
      record.summary.collection === 'knowledge' &&
      record.summary.type === 'convention' &&
      record.searchable.repo === normalizeText(query.repo),
  );

  return rankRecords(records, query.text, query.limit ?? 5);
}

export function findRelatedSessions(
  index: DerivedIndex,
  query: RelatedSessionsQuery,
): RetrievalMatch[] {
  const records = index.records.filter(
    (record) =>
      record.summary.collection === 'session' &&
      record.summary.type === 'session',
  );

  return rankRecords(records, query.text, query.limit ?? 5);
}

# Slices

This file defines the implementation slices for the project. Only one slice may be active at a time.

## Slice Order

1. `S01` Workflow Governance And Role Contracts
2. `S02` Project Bootstrap And Runtime Skeleton
3. `S03` Knowledge Schema And Artifact Contracts
4. `S04` Local Indexer And Deterministic Retrieval Core
5. `S05` MCP Read Path
6. `S06` Session Write Path And Eval Harness
7. `S07` Cloud Seam Preparation

## `S01` Workflow Governance And Role Contracts

### Goal

Lock the repo onto explicit workflow rails before any product implementation starts.

### Success Criteria

- workflow is executable from docs alone
- Controller role is unambiguous and non-implementation by contract
- Planner and Worker contracts are explicit
- polling cadence is documented
- branch naming and PR structure are fixed
- review gate is fixed
- `.claude` helpers exist for roles, commands, and Controller workflow

### Restrictions

- no application code
- no retrieval logic
- no MCP implementation
- no runtime bootstrap

## `S02` Project Bootstrap And Runtime Skeleton

### Goal

Initialize the TypeScript and Node project skeleton that later slices will use.

### Success Criteria

- install, lint, typecheck, test, and build scripts exist
- base folders for source, tests, knowledge, fixtures, and derived state exist
- CLI and MCP entrypoints exist as empty seams

### Restrictions

- no real search logic
- no schema-rich implementation
- no cloud adapters

## `S03` Knowledge Schema And Artifact Contracts

### Goal

Define the canonical artifact model and file contracts for curated knowledge and session memory.

### Success Criteria

- artifact kinds are implemented
- required metadata is enforced
- valid artifacts normalize cleanly
- invalid artifacts fail deterministically
- curated knowledge and session memory are structurally separated

### Restrictions

- no indexer
- no MCP exposure
- no embeddings

## `S04` Local Indexer And Deterministic Retrieval Core

### Goal

Build the local derived index and deterministic-first retrieval pipeline.

### Success Criteria

- index rebuild works from files
- filters and exact identifiers outrank loose matches
- canonical retrieval stays canonical
- historical memory stays isolated
- outputs are compact and provenance-rich

### Restrictions

- no embeddings
- no cloud storage
- no generic search endpoint

## `S05` MCP Read Path

### Goal

Expose narrow read-only retrieval tools through MCP.

### Success Criteria

- `get_repo_conventions`
- `find_canonical_pattern`
- `find_related_sessions`
- `fetch_artifact_summary`
- bounded, stable outputs with truncation and provenance

### Restrictions

- no write path
- no generic search-all tool
- no raw chunk dumping

## `S06` Session Write Path And Eval Harness

### Goal

Add session persistence and retrieval regression measurement.

### Success Criteria

- `save_session_summary` is implemented with validation
- session summaries land in deterministic storage
- eval fixtures exist for representative agent queries
- retrieval behavior can be regression-tested locally

### Restrictions

- no auto-promotion to canonical knowledge
- no autonomous summarization pipeline
- no cloud sync

## `S07` Cloud Seam Preparation

### Goal

Add explicit seams for future cloud-backed storage and retrieval without changing local behavior.

### Success Criteria

- `ArtifactStore`, `SearchIndex`, and `EmbeddingProvider` seams exist
- local truth remains file-backed
- migration path to Supabase and pgvector is documented

### Restrictions

- no real Supabase integration
- no multi-tenant expansion
- no embedding-first rewrite

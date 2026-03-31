---
id: dec-001
type: decision
title: Use Zod for Schema Validation
status: canonical
scope: global
tags:
  - tooling
  - validation
summary: Zod was chosen as the schema validation library for its TypeScript-first design and runtime safety.
created_at: "2024-03-01T00:00:00.000Z"
updated_at: "2024-03-01T00:00:00.000Z"
sources: []
supersedes: []
---

## Context

The project requires strict runtime validation of artifact metadata.

## Decision

Use Zod for schema definition and validation.

## Consequences

All artifact types must be described as Zod schemas. Types are derived via `z.infer`.

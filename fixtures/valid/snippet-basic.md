---
id: snip-001
type: snippet
title: Parse Artifact from Markdown
status: draft
scope: global
language: typescript
tags:
  - parsing
  - artifacts
summary: Utility function to parse a raw markdown string into a canonical Artifact using gray-matter and Zod.
created_at: "2024-05-01T00:00:00.000Z"
updated_at: "2024-05-01T00:00:00.000Z"
sources: []
supersedes: []
---

```typescript
import { parseArtifact } from './schema/index.js';

const raw = await fs.readFile('knowledge/patterns/example.md', 'utf-8');
const artifact = parseArtifact(raw);
console.log(artifact.id, artifact.type);
```

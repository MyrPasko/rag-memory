import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export interface TestArtifact {
  path: string;
  frontmatter: Record<string, string | string[]>;
  body: string;
}

function renderValue(value: string | string[]): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => `"${item}"`).join(', ')}]`;
  }
  return value;
}

export function createTempMemoryRoot(artifacts: TestArtifact[]): {
  rootDir: string;
  cleanup: () => void;
} {
  const rootDir = mkdtempSync(join(tmpdir(), 'rag-memory-'));

  for (const artifact of artifacts) {
    const filePath = join(rootDir, artifact.path);
    mkdirSync(dirname(filePath), { recursive: true });
    const frontmatter = Object.entries(artifact.frontmatter)
      .map(([key, value]) => `${key}: ${renderValue(value)}`)
      .join('\n');
    writeFileSync(filePath, `---\n${frontmatter}\n---\n\n${artifact.body}\n`, 'utf-8');
  }

  return {
    rootDir,
    cleanup: () => rmSync(rootDir, { recursive: true, force: true }),
  };
}

import matter from 'gray-matter';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { dirname, join, resolve } from 'path';
import { z } from 'zod';
import { createMemoryReadMcpServer } from '../mcp/server.js';
import type {
  FetchArtifactSummaryResult,
  FindCanonicalPatternResult,
  FindRelatedSessionsResult,
  GetRepoConventionsResult,
  McpRetrievalMatch,
} from '../mcp/server.js';

const SeedArtifactSchema = z
  .object({
    path: z.string().trim().min(1),
    frontmatter: z.record(z.string(), z.unknown()),
    body: z.string(),
  })
  .strict();

const ConventionEvalCaseSchema = z
  .object({
    name: z.string().trim().min(1),
    tool: z.literal('get_repo_conventions'),
    args: z
      .object({
        repo: z.string().trim().min(1),
        text: z.string().optional(),
        limit: z.number().int().positive().optional(),
      })
      .strict(),
    expected_ids: z.array(z.string()),
  })
  .strict();

const CanonicalPatternEvalCaseSchema = z
  .object({
    name: z.string().trim().min(1),
    tool: z.literal('find_canonical_pattern'),
    args: z
      .object({
        id: z.string().optional(),
        text: z.string().optional(),
        repo: z.string().optional(),
      })
      .strict(),
    expected_id: z.string().nullable(),
  })
  .strict();

const RelatedSessionsEvalCaseSchema = z
  .object({
    name: z.string().trim().min(1),
    tool: z.literal('find_related_sessions'),
    args: z
      .object({
        text: z.string().trim().min(1),
        limit: z.number().int().positive().optional(),
      })
      .strict(),
    expected_ids: z.array(z.string()),
  })
  .strict();

const FetchArtifactSummaryEvalCaseSchema = z
  .object({
    name: z.string().trim().min(1),
    tool: z.literal('fetch_artifact_summary'),
    args: z
      .object({
        id: z.string().trim().min(1),
      })
      .strict(),
    expected_id: z.string().nullable(),
  })
  .strict();

const RetrievalEvalCaseSchema = z.discriminatedUnion('tool', [
  ConventionEvalCaseSchema,
  CanonicalPatternEvalCaseSchema,
  RelatedSessionsEvalCaseSchema,
  FetchArtifactSummaryEvalCaseSchema,
]);

const RetrievalEvalFixtureSchema = z
  .object({
    name: z.string().trim().min(1),
    artifacts: z.array(SeedArtifactSchema),
    cases: z.array(RetrievalEvalCaseSchema),
  })
  .strict();

export type RetrievalEvalFixture = z.infer<typeof RetrievalEvalFixtureSchema>;
export type RetrievalEvalCase = z.infer<typeof RetrievalEvalCaseSchema>;

export interface RetrievalEvalCaseResult {
  name: string;
  tool: RetrievalEvalCase['tool'];
  passed: boolean;
  expected: string[] | string | null;
  actual: string[] | string | null;
}

export interface RetrievalEvalReport {
  fixtureName: string;
  total: number;
  passed: number;
  failed: number;
  cases: RetrievalEvalCaseResult[];
}

async function writeSeedArtifacts(
  rootDir: string,
  artifacts: RetrievalEvalFixture['artifacts'],
): Promise<void> {
  await Promise.all(
    artifacts.map(async (artifact) => {
      const filePath = join(rootDir, artifact.path);
      await mkdir(dirname(filePath), { recursive: true });
      const markdown = `${matter.stringify(artifact.body, artifact.frontmatter).trimEnd()}\n`;
      await writeFile(filePath, markdown, 'utf-8');
    }),
  );
}

function compareIdLists(expected: string[], actual: string[]): boolean {
  return (
    expected.length === actual.length &&
    expected.every((value, index) => actual[index] === value)
  );
}

async function runEvalCase(
  rootDir: string,
  testCase: RetrievalEvalCase,
): Promise<RetrievalEvalCaseResult> {
  const server = createMemoryReadMcpServer({ rootDir });

  switch (testCase.tool) {
    case 'get_repo_conventions': {
      const result = (await server.callTool(
        testCase.tool,
        testCase.args,
      )) as GetRepoConventionsResult;
      const actual = result.results.map(
        (match: McpRetrievalMatch) => match.artifact.id,
      );
      return {
        name: testCase.name,
        tool: testCase.tool,
        passed: compareIdLists(testCase.expected_ids, actual),
        expected: testCase.expected_ids,
        actual,
      };
    }
    case 'find_canonical_pattern': {
      const result = (await server.callTool(
        testCase.tool,
        testCase.args,
      )) as FindCanonicalPatternResult;
      const actual = result.match?.artifact.id ?? null;
      return {
        name: testCase.name,
        tool: testCase.tool,
        passed: testCase.expected_id === actual,
        expected: testCase.expected_id,
        actual,
      };
    }
    case 'find_related_sessions': {
      const result = (await server.callTool(
        testCase.tool,
        testCase.args,
      )) as FindRelatedSessionsResult;
      const actual = result.results.map(
        (match: McpRetrievalMatch) => match.artifact.id,
      );
      return {
        name: testCase.name,
        tool: testCase.tool,
        passed: compareIdLists(testCase.expected_ids, actual),
        expected: testCase.expected_ids,
        actual,
      };
    }
    case 'fetch_artifact_summary': {
      const result = (await server.callTool(
        testCase.tool,
        testCase.args,
      )) as FetchArtifactSummaryResult;
      const actual = result.artifact?.id ?? null;
      return {
        name: testCase.name,
        tool: testCase.tool,
        passed: testCase.expected_id === actual,
        expected: testCase.expected_id,
        actual,
      };
    }
  }
}

export async function readRetrievalEvalFixture(
  fixturePath: string,
): Promise<RetrievalEvalFixture> {
  const raw = await readFile(fixturePath, 'utf-8');
  const parsed = JSON.parse(raw) as unknown;
  return RetrievalEvalFixtureSchema.parse(parsed);
}

export async function runRetrievalEvalFixture(
  fixturePath: string,
): Promise<RetrievalEvalReport> {
  const resolvedFixturePath = resolve(fixturePath);
  const fixture = await readRetrievalEvalFixture(resolvedFixturePath);
  const rootDir = await mkdtemp(join(tmpdir(), 'rag-memory-eval-'));

  try {
    await writeSeedArtifacts(rootDir, fixture.artifacts);
    const cases = await Promise.all(
      fixture.cases.map((testCase) => runEvalCase(rootDir, testCase)),
    );
    const passed = cases.filter((result) => result.passed).length;

    return {
      fixtureName: fixture.name,
      total: cases.length,
      passed,
      failed: cases.length - passed,
      cases,
    };
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
}

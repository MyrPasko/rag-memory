#!/usr/bin/env node

import { resolve } from 'path';
import { runRetrievalEvalFixture } from '../evals/harness.js';

function printUsage(): void {
  console.error(
    'Usage: node dist/cli/main.js eval-retrieval [fixture-path]',
  );
}

async function main(): Promise<void> {
  const [command, fixturePath] = process.argv.slice(2);

  if (command !== 'eval-retrieval') {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const report = await runRetrievalEvalFixture(
    resolve(fixturePath ?? 'fixtures/evals/retrieval-regression.json'),
  );

  console.log(`Fixture: ${report.fixtureName}`);
  for (const result of report.cases) {
    const prefix = result.passed ? 'PASS' : 'FAIL';
    console.log(`${prefix} ${result.tool} :: ${result.name}`);
    if (!result.passed) {
      console.log(`  expected: ${JSON.stringify(result.expected)}`);
      console.log(`  actual:   ${JSON.stringify(result.actual)}`);
    }
  }
  console.log(
    `Summary: ${report.passed}/${report.total} passed, ${report.failed} failed`,
  );

  if (report.failed > 0) {
    process.exitCode = 1;
  }
}

await main();

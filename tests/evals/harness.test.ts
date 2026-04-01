import { describe, expect, it } from 'vitest';
import { runRetrievalEvalFixture } from '../../src/index.js';

describe('runRetrievalEvalFixture', () => {
  it('passes the representative local retrieval regression fixture', async () => {
    const report = await runRetrievalEvalFixture(
      'fixtures/evals/retrieval-regression.json',
    );

    expect(report.fixtureName).toBe('retrieval-regression');
    expect(report.total).toBe(4);
    expect(report.passed).toBe(4);
    expect(report.failed).toBe(0);
    expect(report.cases.every((testCase) => testCase.passed)).toBe(true);
  });
});

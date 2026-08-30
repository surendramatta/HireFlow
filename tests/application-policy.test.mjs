import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applicationStatus, submissionIncrement } from '../src/lib/application-policy.ts';

test('preparing a draft never counts as a submitted application', () => {
  assert.equal(applicationStatus(false), 'ready_to_submit');
  assert.equal(submissionIncrement(false), 0);
});
test('explicit user confirmation records a submission', () => {
  assert.equal(applicationStatus(true), 'applied');
  assert.equal(submissionIncrement(true), 1);
});

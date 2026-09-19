import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, buildPlan, previewPlan, commitPlan, rollbackTransaction } from '../src/engine.js';

test('leaving-home command becomes a multi-tool plan with confirmation for external messaging', () => {
  const plan = buildPlan("I'm heading out. Lock the door, turn off the lights, remind me to bring my charger, and tell Alex I'm on my way.");
  assert.ok(plan.steps.some(s => s.tool === 'door'));
  assert.ok(plan.steps.some(s => s.tool === 'lights'));
  assert.ok(plan.steps.some(s => s.tool === 'reminder'));
  assert.ok(plan.steps.some(s => s.tool === 'message'));
  assert.equal(plan.needsConfirmation, true);
  assert.equal(plan.risk, 'high');
});

test('irreversible finalization is ordered after reversible preparation', () => {
  const plan = buildPlan("Turn off the lights and tell Alex I'm on my way.");
  assert.equal(plan.steps.at(-1).tool, 'message');
  assert.equal(plan.steps.at(-1).phase, 'finalize');
  assert.ok(plan.steps.slice(0, -1).every(step => step.phase === 'prepare'));
});

test('preview emits explicit before and after values', () => {
  const before = initialState();
  const plan = buildPlan('Turn off the lights and lock the door.');
  const diffs = previewPlan(before, plan, 1_000);
  assert.ok(diffs.some(d => d.before === 'on' && d.after === 'off'));
  assert.ok(diffs.some(d => d.before === 'unlocked' && d.after === 'locked'));
});

test('commit applies reversible state changes and external finalization', () => {
  const plan = buildPlan("Turn off the lights and tell Alex I'm on my way.");
  const result = commitPlan(initialState(), plan, 1_000);
  assert.equal(result.ok, true);
  assert.equal(result.state.lights, 'off');
  assert.equal(result.state.messages.at(-1).to, 'Alex');
  assert.equal(result.transaction.events.at(-1).phase, 'finalize');
});

test('prepare-stage failure aborts cleanly before finalization', () => {
  const before = initialState();
  const plan = buildPlan("Turn off the lights, lock the door, and tell Alex I'm on my way.");
  const result = commitPlan(before, plan, 2_000, { failAtPrepareIndex: 1 });
  assert.equal(result.ok, false);
  assert.deepEqual(result.state, before);
  assert.equal(result.transaction, null);
});

test('rollback restores reversible state but truthfully preserves sent-message residuals', () => {
  const before = initialState();
  const plan = buildPlan("Turn off the lights and tell Alex I'm on my way.");
  const committed = commitPlan(before, plan, 3_000);
  const rolled = rollbackTransaction(committed.state, committed.transaction);
  assert.equal(rolled.state.lights, 'on');
  assert.equal(rolled.state.messages.length, 1);
  assert.match(rolled.transaction.residuals[0], /remains sent/);
});

test('sensitive unlock action requires confirmation', () => {
  const plan = buildPlan('Unlock the front door.');
  assert.equal(plan.needsConfirmation, true);
  assert.equal(plan.risk, 'high');
});

test('unsupported instructions degrade to a captured goal instead of inventing tools', () => {
  const plan = buildPlan('Help me prepare for tomorrow');
  assert.equal(plan.steps.length, 1);
  assert.equal(plan.steps[0].tool, 'reminder');
  assert.match(plan.steps[0].label, /Capture goal/);
});

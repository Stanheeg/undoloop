import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initialState,
  buildPlan,
  previewPlan,
  commitPlan,
  rollbackTransaction,
} from '../src/engine.js';

const scenarios = [
  {
    name: 'leaving-home mixed transaction',
    prompt: "I'm heading out. Lock the door, turn off the lights, remind me to bring my charger, and tell Alex I'm on my way.",
  },
  {
    name: 'sensitive unlock plus message',
    prompt: "Unlock the front door, set the thermostat to 20 degrees, and tell Sam I'm home.",
  },
  {
    name: 'focus transaction',
    prompt: 'I need focus time for 45 minutes. Turn on do not disturb and dim the lights.',
  },
  {
    name: 'bedtime transaction',
    prompt: 'Prepare for bedtime. Turn off the living room lights, set the thermostat to 19 degrees, and remind me to charge my phone.',
  },
  {
    name: 'external message only',
    prompt: "Tell Alex I'm running ten minutes late.",
  },
  {
    name: 'unsupported goal is captured conservatively',
    prompt: 'Help me prepare for tomorrow',
  },
  {
    name: 'leaving context synthesizes a reversible security step',
    prompt: 'I am leaving. Remind me to take my keys.',
  },
  {
    name: 'reversible lighting transaction',
    prompt: 'Turn on the lights.',
  },
];

const startingStates = [
  () => initialState(),
  () => ({ ...initialState(), door: 'locked', lights: 'off', thermostat: 18, dnd: true }),
  () => ({
    ...initialState(),
    reminders: [{ text: 'existing reminder', createdAt: 7 }],
    messages: [{ to: 'Pat', body: 'existing', sentAt: 8 }],
    focusUntil: 50_000,
  }),
];

const reversibleKeys = ['door', 'lights', 'thermostat', 'dnd', 'reminders', 'focusUntil'];

for (const scenario of scenarios) {
  startingStates.forEach((makeState, stateIndex) => {
    test(`${scenario.name} preserves transaction invariants from start state ${stateIndex + 1}`, () => {
      const before = makeState();
      const plan = buildPlan(scenario.prompt);

      assert.ok(plan.steps.length > 0, 'planner must produce at least one explicit step');

      const firstFinalize = plan.steps.findIndex(step => step.phase === 'finalize');
      if (firstFinalize >= 0) {
        assert.ok(
          plan.steps.slice(firstFinalize).every(step => step.phase === 'finalize'),
          'irreversible finalization must never be followed by reversible preparation',
        );
      }

      const highRisk = plan.steps.some(step => step.risk === 'high' || step.confirm);
      assert.equal(
        plan.needsConfirmation,
        highRisk,
        'confirmation gate must match the presence of high-risk/explicit-confirmation steps',
      );

      const preview = previewPlan(before, plan, 10_000);
      assert.equal(preview.length, plan.steps.length, 'every step must be visible in the preview');

      const messageCountBefore = before.messages.length;
      const committed = commitPlan(before, plan, 10_000);
      assert.equal(committed.ok, true);
      assert.ok(committed.transaction);

      const prepareSteps = plan.steps.filter(step => step.phase !== 'finalize');
      for (let i = 0; i < prepareSteps.length; i += 1) {
        const failed = commitPlan(before, plan, 10_000, { failAtPrepareIndex: i });
        assert.equal(failed.ok, false, 'prepare-stage failure must abort');
        assert.deepEqual(failed.state, before, 'prepare-stage failure must leave state unchanged');
        assert.equal(failed.transaction, null, 'aborted prepare must not produce a transaction');
      }

      const rolled = rollbackTransaction(committed.state, committed.transaction);
      for (const key of reversibleKeys) {
        assert.deepEqual(
          rolled.state[key],
          before[key],
          `rollback must restore reversible key ${key}`,
        );
      }

      const sentDelta = committed.state.messages.length - messageCountBefore;
      if (sentDelta > 0) {
        assert.deepEqual(
          rolled.state.messages,
          committed.state.messages,
          'irreversible sent messages must remain recorded after rollback',
        );
        assert.equal(
          rolled.transaction.residuals.length,
          sentDelta,
          'each irreversible sent message must be surfaced as a residual',
        );
        assert.ok(
          rolled.transaction.residuals.every(text => /remains sent/.test(text)),
          'residual wording must explicitly state that the message remains sent',
        );
      } else {
        assert.deepEqual(
          rolled.state.messages,
          before.messages,
          'rollback without an external message should fully restore message state',
        );
        assert.deepEqual(rolled.transaction.residuals, []);
      }
    });
  });
}

test('all supported high-risk actions are gated', () => {
  for (const prompt of [
    'Unlock the front door.',
    "Tell Alex I'm home.",
    "Unlock the front door and tell Alex I'm home.",
  ]) {
    const plan = buildPlan(prompt);
    assert.equal(plan.risk, 'high');
    assert.equal(plan.needsConfirmation, true);
  }
});

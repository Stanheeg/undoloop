const clone = (value) => JSON.parse(JSON.stringify(value));

export const initialState = () => ({
  door: 'unlocked',
  lights: 'on',
  thermostat: 21,
  dnd: false,
  reminders: [],
  messages: [],
  focusUntil: null,
});

function normalize(text) {
  return String(text || '').trim().replace(/\s+/g, ' ');
}

function has(text, re) { return re.test(text.toLowerCase()); }

const riskRank = { low: 0, medium: 1, high: 2 };

function stepRisk(step) {
  if (!step.reversible) return 'high';
  if (step.confirm) return 'high';
  if (step.tool === 'door' && step.args.value === 'unlocked') return 'high';
  if (step.tool === 'door') return 'medium';
  if (step.tool === 'thermostat') return 'medium';
  return 'low';
}

function describeValue(value) {
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) return value.length ? `${value.length} item${value.length === 1 ? '' : 's'}` : 'none';
  if (typeof value === 'boolean') return value ? 'on' : 'off';
  return String(value);
}

export function buildPlan(raw) {
  const text = normalize(raw);
  if (!text) return { goal: '', steps: [], risk: 'low', reason: 'No instruction supplied.', needsConfirmation: false };

  const steps = [];
  const lower = text.toLowerCase();
  const add = (tool, label, detail, args = {}, reversible = true, confirm = false, phase = 'prepare') => {
    const step = { tool, label, detail, args, reversible, confirm, phase };
    step.risk = stepRisk(step);
    steps.push(step);
  };

  if (has(lower, /lock (the )?(front )?door|secure (the )?(front )?door/)) add('door', 'Lock the front door', 'Set entry state to locked.', { value: 'locked' });
  if (has(lower, /unlock (the )?(front )?door/)) add('door', 'Unlock the front door', 'Set entry state to unlocked.', { value: 'unlocked' }, true, true);
  if (has(lower, /turn off (the )?(living room )?lights|lights off/)) add('lights', 'Turn off the lights', 'Switch living-room lighting off.', { value: 'off' });
  if (has(lower, /turn on (the )?(living room )?lights|lights on/)) add('lights', 'Turn on the lights', 'Switch living-room lighting on.', { value: 'on' });
  if (has(lower, /dim (the )?lights/)) add('lights', 'Dim the lights', 'Lower lighting to a focus-friendly level.', { value: 'dimmed' });
  if (has(lower, /do not disturb|dnd/)) add('dnd', 'Enable Do Not Disturb', 'Silence non-critical notifications.', { value: true });

  const temp = lower.match(/(?:thermostat|temperature)(?:\s+to|\s+at)?\s+(\d{2})(?:\s*degrees)?/);
  if (temp) add('thermostat', `Set thermostat to ${temp[1]}°C`, 'Adjust simulated home temperature.', { value: Number(temp[1]) });

  const focus = lower.match(/focus(?: time| sprint)?(?: for)?\s+(\d{1,3})\s*minutes?/);
  if (focus) add('focus', `Start ${focus[1]}-minute focus block`, 'Create a local focus timer and completion checkpoint.', { minutes: Number(focus[1]) });

  const remindMatches = [...text.matchAll(/remind me to ([^,.]+)(?:[,.]|$)/gi)];
  for (const m of remindMatches) add('reminder', `Remind: ${m[1].trim()}`, 'Add a personal reminder to the local queue.', { text: m[1].trim() });

  const message = text.match(/(?:tell|text|message)\s+([A-Za-z][A-Za-z0-9_-]*)\s+(?:that\s+)?([^,.]+)(?:[,.]|$)/i);
  if (message) add('message', `Message ${message[1]}`, `Send: “${message[2].trim()}”`, { to: message[1], body: message[2].trim() }, false, true, 'finalize');

  if (has(lower, /heading out|leaving|going out/) && !steps.some(s => s.tool === 'door')) add('door', 'Lock the front door', 'Leaving-home context adds a reversible security step.', { value: 'locked' });
  if (has(lower, /bedtime|going to bed/) && !steps.some(s => s.tool === 'lights')) add('lights', 'Turn off the lights', 'Bedtime context adds a reversible lighting step.', { value: 'off' });

  if (!steps.length) add('reminder', `Capture goal: ${text}`, 'No supported side-effect was inferred, so the agent stores the goal instead of guessing.', { text });

  // Reversible preparation must complete before irreversible external side effects.
  steps.sort((a, b) => (a.phase === 'finalize') - (b.phase === 'finalize'));

  const risk = steps.reduce((acc, step) => riskRank[step.risk] > riskRank[acc] ? step.risk : acc, 'low');
  const needsConfirmation = steps.some(step => step.confirm || step.risk === 'high');
  const reason = needsConfirmation
    ? 'A high-risk or irreversible side effect is present. UndoLoop prepares reversible changes first, then pauses before finalization.'
    : 'Every planned effect is reversible in the local simulation, so UndoLoop can commit the plan transactionally.';

  return { goal: text, steps, risk, reason, needsConfirmation };
}

function applyStep(state, step, now) {
  switch (step.tool) {
    case 'door': state.door = step.args.value; break;
    case 'lights': state.lights = step.args.value; break;
    case 'thermostat': state.thermostat = step.args.value; break;
    case 'dnd': state.dnd = step.args.value; break;
    case 'reminder': state.reminders.push({ text: step.args.text, createdAt: now }); break;
    case 'message': state.messages.push({ to: step.args.to, body: step.args.body, sentAt: now }); break;
    case 'focus': state.focusUntil = now + step.args.minutes * 60_000; break;
    default: throw new Error(`Unknown tool: ${step.tool}`);
  }
}

export function previewPlan(currentState, plan, now = Date.now()) {
  const simulated = clone(currentState);
  const diffs = [];
  for (const step of plan.steps.filter(step => step.phase === 'prepare')) {
    const before = clone(simulated);
    applyStep(simulated, step, now);
    let beforeValue;
    let afterValue;
    switch (step.tool) {
      case 'door': beforeValue = before.door; afterValue = simulated.door; break;
      case 'lights': beforeValue = before.lights; afterValue = simulated.lights; break;
      case 'thermostat': beforeValue = `${before.thermostat}°C`; afterValue = `${simulated.thermostat}°C`; break;
      case 'dnd': beforeValue = before.dnd; afterValue = simulated.dnd; break;
      case 'reminder': beforeValue = before.reminders; afterValue = simulated.reminders; break;
      case 'focus': beforeValue = before.focusUntil ? 'active' : 'inactive'; afterValue = 'active'; break;
      default: beforeValue = '—'; afterValue = '—';
    }
    diffs.push({ label: step.label, before: describeValue(beforeValue), after: describeValue(afterValue) });
  }
  for (const step of plan.steps.filter(step => step.phase === 'finalize')) {
    diffs.push({ label: step.label, before: 'not sent', after: 'will send after confirmation' });
  }
  return diffs;
}

export function commitPlan(currentState, plan, now = Date.now(), options = {}) {
  const before = clone(currentState);
  const prepared = clone(currentState);
  const events = [];
  const prepareSteps = plan.steps.filter(step => step.phase !== 'finalize');
  const finalizeSteps = plan.steps.filter(step => step.phase === 'finalize');
  const failAtPrepareIndex = Number.isInteger(options.failAtPrepareIndex) ? options.failAtPrepareIndex : -1;

  try {
    for (let i = 0; i < prepareSteps.length; i += 1) {
      if (i === failAtPrepareIndex) throw new Error(`Injected prepare failure before step ${i + 1}`);
      const step = prepareSteps[i];
      applyStep(prepared, step, now);
      events.push({ label: step.label, tool: step.tool, reversible: step.reversible, phase: 'prepare' });
    }
  } catch (error) {
    return { ok: false, state: before, error: String(error?.message || error), transaction: null };
  }

  const committed = clone(prepared);
  for (const step of finalizeSteps) {
    applyStep(committed, step, now);
    events.push({ label: step.label, tool: step.tool, reversible: step.reversible, phase: 'finalize' });
  }

  return {
    ok: true,
    state: committed,
    transaction: {
      id: `tx-${now}-${Math.random().toString(36).slice(2, 7)}`,
      goal: plan.goal,
      before,
      after: clone(committed),
      events,
      committedAt: now,
      rolledBack: false,
      residuals: [],
    },
  };
}

export function rollbackTransaction(currentState, transaction) {
  if (!transaction || transaction.rolledBack) return { state: clone(currentState), transaction };

  // Reversible state returns to the snapshot. Irreversible external effects remain recorded.
  const restored = clone(transaction.before);
  const sentAfter = transaction.after.messages || [];
  const sentBefore = transaction.before.messages || [];
  const externalMessages = sentAfter.slice(sentBefore.length);
  restored.messages = clone(sentAfter);

  const residuals = externalMessages.map(message => `Message to ${message.to} remains sent`);
  return {
    state: restored,
    transaction: {
      ...transaction,
      rolledBack: true,
      rolledBackAt: Date.now(),
      residuals,
    },
  };
}

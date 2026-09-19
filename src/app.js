import { initialState, buildPlan, previewPlan, commitPlan, rollbackTransaction } from './engine.js';

let state = initialState();
let pendingPlan = null;
let transactions = [];

const $ = (id) => document.getElementById(id);
const commandInput = $('commandInput');
const planEmpty = $('planEmpty');
const planContent = $('planContent');
const planTitle = $('planTitle');
const planSteps = $('planSteps');
const planReason = $('planReason');
const riskBadge = $('riskBadge');
const ledger = $('ledger');
const undoBtn = $('undoBtn');
const confirmDialog = $('confirmDialog');

function esc(v) {
  return String(v).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
}

function stateCards() {
  const nextReminder = state.reminders.at(-1)?.text || 'None';
  const lastMessage = state.messages.at(-1);
  const focus = state.focusUntil && state.focusUntil > Date.now() ? 'Active' : 'Inactive';
  return [
    ['Front door', state.door],
    ['Living lights', state.lights],
    ['Thermostat', `${state.thermostat}°C`],
    ['Do Not Disturb', state.dnd ? 'On' : 'Off'],
    ['Latest reminder', nextReminder],
    ['Last message', lastMessage ? `To ${lastMessage.to}` : 'None'],
    ['Focus block', focus],
    ['Transactions', String(transactions.filter(t => !t.rolledBack).length)],
  ];
}

function renderState() {
  $('stateGrid').innerHTML = stateCards().map(([label,value]) => `<div class="state-card"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div></div>`).join('');
}

function renderPlan() {
  if (!pendingPlan) {
    planEmpty.classList.remove('hidden');
    planContent.classList.add('hidden');
    planTitle.textContent = 'Nothing queued yet';
    riskBadge.className = 'risk neutral';
    riskBadge.textContent = 'Waiting';
    return;
  }
  planEmpty.classList.add('hidden');
  planContent.classList.remove('hidden');
  planTitle.textContent = `${pendingPlan.steps.length} step${pendingPlan.steps.length === 1 ? '' : 's'} ready`;
  riskBadge.className = `risk ${pendingPlan.risk}`;
  riskBadge.textContent = `${pendingPlan.risk[0].toUpperCase()}${pendingPlan.risk.slice(1)} risk`;
  const diffs = previewPlan(state, pendingPlan);
  planSteps.innerHTML = pendingPlan.steps.map((step, index) => `<li class="step"><div><strong>${esc(step.label)}</strong><small>${esc(step.detail)}</small><small class="diff">${esc(diffs[index]?.before ?? '—')} → ${esc(diffs[index]?.after ?? '—')}</small></div><span class="tag ${esc(step.risk)}">${esc(step.phase)} · ${esc(step.risk)}</span></li>`).join('');
  planReason.textContent = pendingPlan.reason;
  $('executeBtn').textContent = pendingPlan.needsConfirmation ? 'Review & commit' : 'Commit plan';
}

function renderLedger() {
  if (!transactions.length) {
    ledger.innerHTML = '<p class="muted">No committed actions yet.</p>';
    undoBtn.disabled = true;
    return;
  }
  ledger.innerHTML = transactions.slice().reverse().map(tx => `
    <div class="tx ${tx.rolledBack ? 'rolled' : ''}">
      <div class="tx-head"><strong>${esc(tx.goal)}</strong><span class="${tx.rolledBack ? 'rollback' : 'success'}">${tx.rolledBack ? 'Rolled back' : 'Committed'}</span></div>
      <ul>${tx.events.map(e => `<li>${esc(e.label)} <small>(${esc(e.phase)})</small></li>`).join('')}</ul>
      ${tx.residuals?.length ? `<div class="residual"><strong>Residual effects:</strong> ${tx.residuals.map(esc).join(' · ')}</div>` : ''}
    </div>`).join('');
  undoBtn.disabled = !transactions.some(t => !t.rolledBack);
}

function renderAll() { renderState(); renderPlan(); renderLedger(); }

function queuePlan(text) {
  pendingPlan = buildPlan(text);
  renderPlan();
}

function doCommit() {
  if (!pendingPlan) return;
  const result = commitPlan(state, pendingPlan);
  if (!result.ok) return;
  state = result.state;
  transactions.push(result.transaction);
  pendingPlan = null;
  renderAll();
}

$('commandForm').addEventListener('submit', (event) => {
  event.preventDefault();
  queuePlan(commandInput.value);
});

for (const button of document.querySelectorAll('.scenario')) {
  button.addEventListener('click', () => {
    commandInput.value = button.dataset.prompt;
    queuePlan(commandInput.value);
  });
}

$('discardBtn').addEventListener('click', () => { pendingPlan = null; renderPlan(); });
$('executeBtn').addEventListener('click', () => {
  if (!pendingPlan) return;
  if (pendingPlan.needsConfirmation && typeof confirmDialog.showModal === 'function') {
    $('confirmText').textContent = pendingPlan.steps.some(s => s.tool === 'message')
      ? 'This plan includes a message to another person. UndoLoop pauses before an external social side effect.'
      : 'This plan includes a sensitive action. Review it before committing.';
    confirmDialog.showModal();
  } else doCommit();
});
confirmDialog.addEventListener('close', () => { if (confirmDialog.returnValue === 'confirm') doCommit(); });
$('resetBtn').addEventListener('click', () => { state = initialState(); pendingPlan = null; transactions = []; renderAll(); });
undoBtn.addEventListener('click', () => {
  const index = transactions.findLastIndex(t => !t.rolledBack);
  if (index < 0) return;
  const result = rollbackTransaction(state, transactions[index]);
  state = result.state;
  transactions[index] = result.transaction;
  renderAll();
});

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (Recognition) {
  const recognition = new Recognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.onresult = (event) => {
    commandInput.value = event.results[0][0].transcript;
    queuePlan(commandInput.value);
  };
  $('micBtn').addEventListener('click', () => recognition.start());
} else {
  $('micBtn').disabled = true;
  $('voiceHint').textContent = 'Voice input is unavailable in this browser; text input remains fully functional.';
}

renderAll();

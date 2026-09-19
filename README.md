# UndoLoop

**A simulated Alexa+ experience where multi-step agent actions are inspectable, transactional, and reversible.**

Built during the 2026 Amazon Developer Hackathon submission window for the Alexa+ track. The project uses the hackathon's explicitly supported **simulated Alexa+ experience** path, which does not require a specific framework or SDK.

## Why this exists

Voice agents are useful when they can act, but action creates a trust problem: one misunderstood instruction can change several systems at once. UndoLoop explores a simple product idea — **every multi-step agent action should behave like a transaction**.

The experience separates planning from execution, marks sensitive side effects, asks before committing external communication, records a before-state snapshot, and lets the user undo a whole committed plan.

## What it demonstrates

- Natural-language goal → multi-step plan
- Multiple simulated tools: door, lights, thermostat, Do Not Disturb, reminders, messages, focus timer
- Confirmation gate for external/social side effects
- Explicit before → after diff previews
- Risk levels and confirmation for high-risk actions
- Two-phase execution: reversible prepare, then irreversible finalize
- Atomic prepare semantics with clean abort on failure
- Rollback that restores reversible state while truthfully reporting irreversible residuals
- Action ledger that explains exactly what changed
- Browser speech recognition when available
- No cloud account, API key, paid service, or external runtime dependency

## Run

```bash
npm run serve
```

Open `http://localhost:4173`.

The app is static and uses only browser APIs. The included Node server is zero-dependency and exists only for local development/demo serving.

## Test

```bash
npm test
npm run check
```

Tests cover risk classification, execution ordering, before/after previews, successful commits, injected prepare-stage failure, rollback residuals, sensitive confirmation, and conservative fallback behavior.

## Suggested demo flow (under 3 minutes)

1. Open with the line: “What if an assistant could undo a whole chain of actions, not just apologize after getting one wrong?”
2. Run the **Leaving home** scenario.
3. Point out that the message step triggers confirmation while reversible home state changes are still previewed.
4. Commit and show door/lights/reminder/message state changing together.
5. Click **Undo last commit** and show the reversible simulated world return while any already-sent message remains as a truthful residual.
6. Run the focus or bedtime scenario to demonstrate another domain.
7. Close on the product principle: “Agent actions should be observable, gated, and reversible by default.”

## Product feedback / friction log draft

### What worked well
The Alexa+ simulated-experience path is unusually accessible: it lets builders test interaction models and agent UX without requiring preview hardware or access to a production Alexa+ integration surface.

### What could be clearer
The rules distinguish the simulated-experience path from the MCP/Agent Skill path, but the submission page could expose that choice earlier and provide one minimal example showing exactly what judges consider sufficient for a simulation.

### Feature request
Provide a small official “simulated Alexa+ interaction contract” or sample event schema. It would let teams build richer simulations while keeping demos comparable and would make later migration to Agent Skills or MCP more straightforward.

## Hackathon submission checklist still requiring account-side actions

- [ ] Join the Amazon Developer Hackathon on Devpost
- [x] Publish this source in a new GitHub repository created during the hackathon window
- [ ] Record and upload a <3 minute English demo video to YouTube or Vimeo
- [ ] Submit the project, feedback, chosen Alexa+ track, and repository/video links on Devpost
- [ ] If entering the Open Source mini challenge, use a newly published open-source repository and provide the required contribution metadata

## AI disclosure

This project was designed, implemented, and tested with AI assistance at Stan's direction. The included automated tests and manual HTTP smoke checks are intended to make the actual behavior inspectable rather than relying on generated claims.

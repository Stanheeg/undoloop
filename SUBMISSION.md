# Devpost submission draft — Amazon Build, Ship, Shape

## Project name
UndoLoop

## Primary track
Alexa+

## Mini challenge
Open Source

## One-line pitch
A simulated Alexa+ agent that previews side effects, commits reversible work transactionally, and tells the truth about what cannot be undone.

## Live demo
https://undoloop-tbvbgl.v2.appdeploy.ai/

This is the deployed judge demo of the same public repository submission. No account, API key, or paid service is required to interact with it.

## Project description
UndoLoop explores a trust primitive for action-taking agents: **preview, gate, commit, and undo**.

A user gives the simulated Alexa+ experience a natural-language goal such as leaving home. UndoLoop turns it into a multi-tool plan, shows explicit before → after diffs, labels the risk of each action, and pauses before sensitive or irreversible side effects. Reversible preparation is completed before irreversible finalization. Every committed action is recorded in a ledger.

If the user changes their mind, one Undo action restores the reversible snapshot. UndoLoop does not pretend every action can be reversed: an already-sent simulated message remains visible as a residual effect. The result is an interaction model where agent side effects are observable and honest instead of hidden behind a single confirmation button.

The current simulation covers door state, lights, thermostat, Do Not Disturb, reminders, focus timers, and external messages.

## Technical implementation
- Zero-dependency static web application with browser-native JavaScript.
- Deterministic natural-language planner for the supported simulated tool surface.
- Explicit low / medium / high risk classification.
- Prepare/finalize execution phases so reversible work happens before irreversible side effects.
- Atomic prepare behavior: an injected prepare failure aborts without finalization.
- Before-state snapshots and transaction ledger.
- Rollback with residual-effect accounting for irreversible actions.
- Browser speech recognition when available; full functionality remains accessible through text.
- Zero-dependency Node static server for local judging.

Verification:
- Local test suite: **8/8 PASS**.
- Local syntax checks: PASS.
- Local HTTP smoke checks: PASS.
- GitHub Actions CI: PASS.

## Alexa+ track fit
UndoLoop uses the hackathon's explicitly permitted **simulated Alexa+ experience** route. It does not claim production Alexa+ API access, MCP connectivity, real device control, or real message delivery.

## Why it matters
Agents are increasingly able to act across homes, communications, and services. As capability grows, a wrong interpretation can create several side effects at once. UndoLoop demonstrates a reusable interaction/runtime pattern for making those actions inspectable and reversible by default while remaining honest about the operations that cannot truly be undone.

## Product feedback

### Developer tools / APIs / SDKs used
For the Alexa+ track, I used the official simulated-experience option rather than production Alexa+ APIs or an MCP server. The implementation itself uses browser APIs and Node.js only.

### What worked well
The simulated Alexa+ option creates a low-friction way to explore agent UX and trust models without requiring preview hardware or production Alexa+ access. It let the project focus on the interaction model—planning, risk, confirmation, execution, and rollback—while remaining testable locally.

### What needs work
The simulation route is easy to miss because the surrounding Alexa+ material emphasizes MCP and Agent Skills. The requirements become clear in the official rules, but a first-time builder has to distinguish what applies to MCP submissions from what applies to simulated experiences.

### Onboarding experience
Once the simulation exemption was identified, getting from zero to a working prototype was straightforward because no account credential, proprietary runtime, or paid infrastructure was required.

### Would I build with this ecosystem again?
Yes. A simulation-first path is useful for validating agent interaction concepts before investing in production integration. A clearer migration path from simulation to Agent Skills or MCP would make that progression stronger.

## Feature request — Important
Publish a small official **simulated Alexa+ interaction contract / starter project** showing the minimum expected shape of a simulation and how a successful prototype can later map onto Agent Skills or MCP. This would reduce ambiguity while keeping the simulation route framework-agnostic.

## Friction log

### Friction 1 — determining the exact simulation runtime requirement
- **Task attempted:** Determine what technology a simulated Alexa+ submission must use at runtime.
- **Steps taken:** Read the hackathon overview and official rules, compared the MCP requirements with the simulation exception, then implemented the web simulation path.
- **Expected:** One simulation-specific setup checklist.
- **Actual:** MCP runtime-hook requirements and the simulation route appear close together, so it takes extra reading to establish which constraints are exempted for a simulation.
- **Severity:** Moderate.
- **Workaround:** Used the official rule explicitly stating that a simulated Alexa+ experience may use any AI or agentic tool and is exempt from the runtime-technology-hook requirement.
- **Actionable suggestion:** Add a dedicated "Simulated Alexa+ starter" section with one minimal reference implementation and a checklist for judging requirements.

## Open Source mini challenge
- **Contribution URL:** https://github.com/Stanheeg/undoloop
- **Project repository:** https://github.com/Stanheeg/undoloop
- **GitHub username:** Stanheeg
- **What I contributed:** A new MIT-licensed project created during the hackathon window implementing a transactional, reversible interaction model for a simulated Alexa+ agent.
- **How it works:** Natural-language goals become risk-scored tool plans. Reversible preparation is committed before irreversible finalization, and an action ledger stores the transaction snapshot for rollback.
- **Why it matters:** The project provides a concrete pattern for trustworthy agent side effects that can generalize beyond this particular simulation.

## Judge/test instructions
Fastest path: open the live demo at https://undoloop-tbvbgl.v2.appdeploy.ai/ and choose **Leaving home**.

For source verification:
```bash
npm test
npm run check
npm run serve
```

Then open `http://localhost:4173`.

Recommended demo scenario:
1. Choose **Leaving home**.
2. Review the before → after plan and high-risk confirmation.
3. Confirm and commit.
4. Inspect the changed simulated world and action ledger.
5. Select **Undo last commit**.
6. Observe reversible state restoration and the truthful residual message.

## Demo video
Public YouTube/Vimeo URL: **PENDING UPLOAD**

The prepared demo is under 3 minutes and shows the actual simulation behavior.

## Repository
https://github.com/Stanheeg/undoloop

## AI assistance disclosure
The project was designed, implemented, tested, and documented with AI assistance at Stan's direction. Automated tests, CI, and explicit build evidence are included so the observable behavior can be verified independently rather than relying on generated claims.

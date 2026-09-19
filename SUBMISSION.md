# Submission draft — Amazon Build, Ship, Shape

## Project
UndoLoop

## One-line pitch
A simulated Alexa+ agent that previews side effects, commits reversible work transactionally, and tells the truth about what cannot be undone.

## What it does
UndoLoop turns a natural-language goal into a multi-tool plan, shows explicit before → after diffs, labels risk, asks for confirmation on high-risk or irreversible actions, executes reversible preparation before irreversible finalization, records an action ledger, and supports rollback with residual-effect reporting.

## Why it matters
Agents are becoming capable of acting across homes, communications and services. UndoLoop explores a trust primitive for that future: actions should be observable before execution, safely staged, and reversible by default.

## Alexa+ track fit
This repository implements the contest-permitted simulated Alexa+ experience path. It does not claim production Alexa+ API access or real device control.

## Evidence
Run `npm test`, `npm run check`, and `npm run serve`. See BUILD_EVIDENCE.md.

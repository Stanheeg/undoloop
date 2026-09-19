# Judge map

## Technical implementation
- Deterministic planner and simulated multi-tool runtime
- Explicit prepare/finalize phases
- Atomic prepare abort behavior
- Reversible snapshot rollback with residual-effect accounting
- 8 automated tests plus syntax and HTTP smoke checks

## Design
- Before → after diffs
- Risk badges and confirmation gates
- Action ledger and rollback feedback
- Text-first flow with optional browser speech recognition

## Potential impact
UndoLoop proposes a reusable interaction/runtime pattern for action-taking agents: observe planned side effects, stage reversible actions, gate high-risk finalization, and preserve truthful rollback semantics.

## Quality of idea
The project focuses on a narrow but general agent problem: preventing silent side effects and misleading “undo” claims.

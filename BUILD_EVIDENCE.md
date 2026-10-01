# Build evidence — 20 Sep 2026

- `npm test`: PASS — **33/33 Node tests**, 0 failures.
- Test composition: 8 focused engine tests + 25 transaction-invariant checks across multiple scenarios and starting states.
- Invariants covered include prepare-before-finalize ordering, high-risk confirmation gating, complete preview visibility, atomic prepare abort, reversible-state restoration, and explicit residual accounting for irreversible sent-message effects.
- `npm run check`: PASS — `src/engine.js`, `src/app.js`, and `scripts/serve.mjs` all pass `node --check`.
- Local HTTP smoke check: PASS — `/` and `/src/engine.js` both returned HTTP 200 from the included zero-dependency Node server on `127.0.0.1:4173`.
- No Amazon production API, paid cloud service, account credential, or user PC was used for the core implementation/tests.
- This is the contest-permitted simulated Alexa+ route, not a production Alexa+ integration.

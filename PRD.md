# Product Requirements Document (PRD)

## LegacyProof — AI-Powered Legacy Code Modernizer with Equivalence Verification

**Built for:** BuildSprint by LatentForce.ai (48-hour build sprint)
**Version:** 1.0 (Hackathon MVP scope)

---

## 1. One-Line Pitch

LegacyProof takes old, outdated JavaScript code, rewrites it into modern, clean TypeScript — and **proves** the new version behaves exactly like the old one, live, using auto-generated tests.

---

## 2. Problem Statement

Engineering teams everywhere are sitting on old code (jQuery spaghetti, ES5 utility functions, copy-pasted business logic) that nobody wants to touch. The fear isn't "can AI rewrite this?" — AI can already do that. The fear is: **"how do I know the rewrite didn't silently break something?"**

Most AI coding tools generate plausible-looking code and ask you to trust it. There's no proof, just vibes. That trust gap is exactly why so much legacy code never gets modernized, even when everyone agrees it should be.

## 3. Target Users

- Engineering teams maintaining old JS/jQuery codebases who want to modernize but are risk-averse.
- Individual developers inheriting legacy code with no documentation or tests.
- (Longer-term / enterprise version) Organizations doing large-scale code migrations — directly aligned with LatentForce's own core product space.

## 4. Goals

### Hackathon goals (48 hours)

- Ship a working, demoable end-to-end pipeline: paste legacy code → get modernized code → get proof it's equivalent.
- Make the "proof" moment visually obvious and undeniable (a test suite going from red to green, live).
- Keep 100% of the stack on free tools (see `TECH_STACK.md`).

### Longer-term vision (not required for hackathon, good for pitch)

This build proves the core pattern — generating tests from real behavior, then verifying a rewrite against them — at the level of a single function. That pattern doesn't change at scale; only the surface area does. The same approach extends directly to:

- Support more legacy languages/frameworks (Python 2, old PHP, AngularJS).
- Batch-process entire repositories instead of single functions/files.
- Integrate into CI so equivalence-proofing runs automatically on every migration PR.

## 5. Success Metrics (for the demo, not a real product)

| Metric                                            | Target                                    |
| ------------------------------------------------- | ----------------------------------------- |
| Time from pasting code to seeing pass/fail result | < 30 seconds                              |
| Demo reliability (works without manual fixing)    | 100% on the 2–3 rehearsed examples        |
| Judges can clearly see _why_ it's trustworthy     | Yes — visible test diff, not just a claim |

## 6. Core User Flow

1. User pastes a snippet of legacy JavaScript (a function, a small module, or jQuery-based utility code) into the app.
2. User clicks **"Modernize."**
3. The system:
   a. Analyzes the legacy code's behavior.
   b. Auto-generates a test suite describing that behavior (inputs → expected outputs).
   c. Runs those tests against the **original** code — all should pass (baseline check).
   d. Rewrites the code into modern TypeScript/ES6+.
   e. Runs the **same test suite** against the **new** code.
4. UI shows: original code | modernized code | live test results (red → green), side by side.
5. If any test fails, the failure is shown clearly (this is a legitimate, honest outcome — not a bug in the demo, it's the tool doing its job).

## 7. Features

### MVP — Must-Have for Demo

- Text input for pasting legacy JS code.
- LLM-powered code modernization (old JS/jQuery → modern TypeScript).
- LLM-powered test case generation from the legacy code's behavior.
- In-browser sandboxed execution of both old and new code against the generated tests (no backend execution needed — see tech stack).
- Clear pass/fail visual result (test list with ✅ / ❌ per test).
- Side-by-side code view (before / after).

### Stretch Goals (only if MVP is done early)

- "Explain the diff" — a short AI-generated summary of what changed and why.
- Support for a second legacy pattern (e.g., old `var`/callback-based code → `async/await`).
- Downloadable report (modernized code + test results) as a shareable artifact.

### Out of Scope (explicitly, for 48 hours)

- Full repository/multi-file migration.
- Support for languages other than JavaScript.
- User accounts, saved history, or persistence across sessions.
- Production-grade security hardening of the sandbox (fine for a demo, not for real untrusted code at scale).

## 8. Judging Criteria Alignment

| Criteria                      | Weight | How this project scores                                                                                                                                           |
| ----------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Idea & Innovation             | 30%    | Most AI coding demos generate code and ask for trust; this one proves correctness live. Also mirrors LatentForce's own "verification-first" migration philosophy. |
| Execution & Technical Quality | 30%    | Working end-to-end pipeline: generation → test synthesis → dual execution → verification. Demo outcome is unambiguous (pass/fail), not subjective.                |
| Usefulness & Impact           | 25%    | Directly addresses the real reason legacy code doesn't get modernized: lack of trust in AI rewrites.                                                              |
| Presentation & Demo           | 15%    | Visual, concrete "watch the tests go green" moment — a strong 60–90 second demo beat.                                                                             |

## 9. Risks & Mitigations

| Risk                                                                        | Mitigation                                                                                                                                                                           |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LLM generates a modernized version that's _actually_ behaviorally different | This is a real, honest outcome — show it as evidence the tool works ("see, it caught a real difference"), don't hide it. Pre-test your rehearsed examples so you know their outcome. |
| Live demo depends on an API call succeeding on stage                        | Have a pre-recorded fallback run/video as backup; keep prompts short to minimize latency; use a fast free LLM API (see tech stack).                                                  |
| Sandboxed execution has edge-case bugs                                      | Scope legacy input to pure functions (no DOM/network access) for the demo — keeps sandboxing simple and reliable.                                                                    |
| Team has mixed skill levels                                                 | Split cleanly: frontend/UI, backend/orchestration, and prompt engineering can be worked on in parallel from hour 1.                                                                  |

## 10. Demo Script (target: 90 seconds)

1. **(15s) Problem:** "Every team has code like this — nobody dares touch it because you can't prove a rewrite is safe."
2. **(45s) Live demo:** Paste a real (slightly gnarly) legacy JS snippet → click Modernize → narrate as tests generate, run against the old code (baseline pass), then run against the new modernized code live → tests turn green on screen.
3. **(20s) What's under the hood:** One sentence on how it works (LLM generates behavior-based tests, not just code) — this is the technical credibility beat.
4. **(10s) Close:** "This is legacy modernization you don't have to take on faith."

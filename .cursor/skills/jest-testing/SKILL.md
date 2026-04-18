---
name: jest-testing
description: >-
  Writes and maintains high-quality Jest tests with TDD discipline, repository-aware
  conventions, AAA structure, and behavior-focused assertions. Use when adding or
  changing tests, practicing red-green-refactor, fixing flaky Jest suites, reviewing
  test quality, or when the user mentions Jest, unit tests, integration tests with
  Jest, matchers, jest.fn, or test-driven development in JS/TS projects.
---

# Jest Testing (TDD + Repository Conventions)

**Source of truth for framework mechanics:** official Jest documentation at [jestjs.io](https://jestjs.io/) (Getting Started, Configuration, Expect, Mock Functions, Jest CLI). Prefer idiomatic Jest APIs and matchers from current docs over remembered API trivia.

This skill encodes **workflow** (vertical-slice TDD), **guardrails** (behavior over implementation; minimal mocks), and **repo alignment** (infer and follow local patterns). It complements—not replaces—the Jest docs.

### In this monorepo (LTI / backend vs frontend)

- **`backend/`** uses **`npm test`** → **`jest`** (see `backend/package.json`). Run coverage from `backend/`, e.g. `npm test -- --coverage`.
- **`frontend/`** uses its own Jest setup (**`jest.config.js`**, CRA-style)—do not assume the same config as backend.
- **Exception (Cursor backend test workflow):** this repository’s agents may require **all** backend unit tests for the candidate-insertion workflow in **one** file: **`backend/src/tests/tests-ics.test.ts`**. That **overrides** default colocation *for that workflow only*—see [`.cursor/agents/backend-test-developer.md`](../../agents/backend-test-developer.md) and **[`docs/backend-test-workflow.md`](../../../docs/backend-test-workflow.md)**. Everywhere else, follow **existing** test placement discovered in the repo (see §2).

## 1. Purpose

Help the agent to:

- **Analyze the repository first**, then mirror its testing style.
- **Infer** existing test placement, naming, TS/JS patterns, module system, toolchain, and mocking habits.
- **Write or update** Jest tests that match the repo and stay stable across refactors.
- **Apply TDD in vertical slices**: one failing test → minimal pass → green → refactor; repeat.
- **Avoid brittle tests** that couple to private helpers, internal state, or excessive mocks.

## 2. Mandatory: Repository Inspection Before Writing Tests

**Do not generate tests in a vacuum.** Before creating or moving test files, inspect the codebase (search, list directories, read configs and sample tests):

| Inspect | Why |
|--------|-----|
| Folder layout (`src/`, `lib/`, `packages/`) | Placement and import paths |
| Existing test locations (`**/*.test.*`, `**/*.spec.*`, `__tests__/`, `tests/`) | **Do not invent a parallel convention** |
| File naming (`.test.ts` vs `.spec.ts`) | Match the majority pattern |
| JavaScript vs TypeScript | File extensions and types |
| Module system | `import`/`export` (ESM) vs `require`/`module.exports` (CJS) |
| `jest.config.*`, `package.json` `jest` field | Environment, roots, transforms, `testMatch`, projects |
| Setup files (`setupFilesAfterEnv`, `setupFiles`) | Global matchers, `jest.setup.js` |
| Existing mocking style (`jest.mock`, manual mocks `__mocks__/`, MSW, etc.) | Stay consistent |
| Vite / other bundlers (`vite.config.*`) | If **Vite present but Jest absent**, **warn**: Vitest is common; do **not** install Jest or scaffold config unless the user asked for Jest setup |

**Rules:**

1. **Follow existing local conventions first.** If the repo colocates tests, you colocate. If it uses `tests/unit/`, you use that.
2. **Do not invent a new convention** when a clear one exists.
3. **Only introduce a new convention** when none exists; **briefly explain** in the user-facing response what you chose and why (e.g. colocated `*.test.ts` as default).
4. **Do not add** new Jest config or setup files unless required to fulfill the request or unblock tests—and **prefer** extending existing config.

## 3. Test Placement (Priority Order)

1. **Match the repository’s existing pattern** (highest priority).
2. If the repo **colocates** tests with sources, place tests beside the module under test.
3. If the repo uses **centralized** test directories (`tests/`, `__tests__/` at root or per package), follow that.
4. **If there is no convention:** default to **colocated** files for **unit-level** behavior:

   - Source: `src/foo/bar.ts`
   - Test: `src/foo/bar.test.ts` (or `.js` / `.tsx` / `.jsx` matching the source)

5. **Integration or cross-module flows** may live in dedicated folders (`integration/`, `e2e/`, `tests/integration/`) **if the repo already separates them**. Do not create a second parallel integration layout.

## 4. Naming Rules

**Files:** use `.test.js`, `.test.jsx`, `.test.ts`, or `.test.tsx` **according to what the repo already uses**. If the repo standardizes on `.spec.*`, **match that** instead—do **not** mix `.test` and `.spec` in the same area without reason.

**`describe`:** name after the **public unit under test** (module, class, hook, or route handler)—the **behavior surface**, not file paths unless that is the project norm.

**`test` / `it` titles:** behavior specifications, **not** implementation steps.

| Good | Bad |
|------|-----|
| `returns 404 when the order does not exist` | `calls map correctly` |
| `creates an invoice for a valid order` | `sets internal flag` |
| `rejects when the payload is missing the required email field` | `works` |

Use **present tense** or **states a fact about behavior**; avoid vague verbs with no observable outcome.

## 5. AAA Structure (Arrange, Act, Assert)

Every test **must** be readable as three phases:

1. **Arrange** — build minimal context: data, system under test, **realistic** inputs. Only mock boundaries that are slow, non-deterministic, or external per repo norms.
2. **Act** — invoke the **public** API (exported function, class method, HTTP handler, React component user event) that represents the behavior.
3. **Assert** — check **observable outcomes** (return value, thrown error, state visible via public API, DOM, or captured calls to explicit fakes at boundaries).

**Formatting:**

- Separate **Arrange**, **Act**, and **Assert** with **blank lines**.
- Add `// Arrange`, `// Act`, `// Assert` comments when non-trivial tests would otherwise hide the structure.

**One act per test** unless the behavior under specification is **inherently multi-step** (e.g. “completes checkout including login and confirmation”—and even then prefer smaller tests if the repo style does).

**Assertions:** focused, proportional to the behavior; avoid unrelated expectations in the same test.

## 6. TDD Workflow (Strict, Practical)

Use **vertical slices** (one behavior at a time through the stack you are changing). Reject **horizontal slicing** (writing all tests for layer A before any production code).

**Loop:**

1. Identify **one** observable behavior to lock in (prefer public contract).
2. Write **one** failing test that describes that behavior and fails for the **right reason** (red).
3. Implement the **smallest** change that makes it pass (green).
4. **Run** the relevant tests.
5. **Refactor only on green**—never refactor while red.
6. Repeat for the next behavior.

**Forbidden:**

- Writing **all** tests for a feature in bulk before implementation (unless the user explicitly asked for a test-only pass—and still prefer one behavior at a time).
- Refactoring production or test code **while tests are red**.
- **Guessing** future requirements and adding speculative tests.

## 7. Testing Philosophy

**Encourage:**

- Exercise code through **public interfaces** (exports, HTTP routes, component props/events).
- Assert **observable behavior** and meaningful outputs.
- Prefer **realistic** inputs and edge cases tied to domain rules.
- Prefer **integration-style** tests for important business behavior when speed allows and the repo patterns support it.
- Use **mocks sparingly**: at IO boundaries (network, clock, randomness, filesystem) when isolation is needed—or when the repo already does so consistently.

**Discourage:**

- Calling **private** functions or reading private state (language hacks, `._internals`).
- Asserting **implementation details** (internal call order, private flags) unless that is truly the contract.
- **Excessive** `jest.mock` of every dependency; **snapshot** abuse for large or volatile structures.
- **Overfitting** assertions to the current code shape (e.g. asserting exact intermediate strings that are not part of the contract).

## 8. Jest-Specific Guidance (Idiomatic, Minimal Surprise)

- Use **`describe`**, **`test`** or **`it`**, and **`expect`** consistently with project style.
- Use **Jest matchers** idiomatically (`toBe` vs `toEqual`, `toMatchObject`, `rejects`/`resolves` for async) per [Expect](https://jestjs.io/docs/expect).
- **Async:** prefer **`async`/`await`** with proper `await`; or return a **Promise**; for sync errors in async code, use `await expect(promise).rejects...` or `expect.assertions(n)` when asserting in `catch`/`then` paths per [Asynchronous](https://jestjs.io/docs/asynchronous).
- **TypeScript:** align with the repo—either globals from `@jest/globals` / `types` in `tsconfig`, or explicit imports; **do not** switch styles without repo precedent.
- **`jest.fn()`**, **`jest.spyOn`**, **`jest.mock`**: use when the boundary must be controlled; restore/clear per [`jest` object](https://jestjs.io/docs/jest-object) and repo patterns.
- **Timers:** use [Timer mocks](https://jestjs.io/docs/timer-mocks) when testing time-dependent logic; restore real timers after.
- **Snapshots:** use for stable UI fragments or error messages **when justified**; avoid giant snapshots that encode entire implementation trees.

**Setup / config:**

- Do **not** create new `jest.config.*`, `setupTests`, or `setupFilesAfterEnv` unless needed **and** aligned with the request.
- If **Jest is not** in `package.json` dependencies: **do not** add it unless the user asked to introduce Jest. If they want tests without choosing a runner, state the gap and ask—or follow an existing runner (e.g. Vitest) if that is what the repo uses.
- **Vite + no Jest:** warn briefly that Vitest or another runner may already fit; avoid blindly forcing Jest.

## 9. Required User-Facing Output

When this skill is applied, structure the reply to include:

1. **Short summary** of the **behavior** under test (one or two sentences).
2. **Path(s)** where test file(s) were **created or updated**.
3. **The test code** (and key production changes if any).
4. **Assumptions** about conventions (placement, naming, mock style).
5. **Risks or mismatches** (config gaps, ESM/CJS friction, missing Jest, duplicate conventions).

## 10. Quality Checklist (Quick)

Before finishing, mentally verify (expanded version: [checklists.md](checklists.md)):

- [ ] Test targets **behavior**, not implementation detail.
- [ ] Entry point is a **public** interface.
- [ ] Matches **existing repo** conventions (path, naming, mocks).
- [ ] **AAA** visible (blank lines; comments if needed).
- [ ] **Minimal** mocking; boundaries only.
- [ ] **One primary behavior** per test.
- [ ] Test likely **survives** a sensible refactor.
- [ ] Production/test code changes are **minimal** for the current red→green step.
- [ ] No speculative “future” tests.

## 11. Anti-Patterns (Summary)

See [anti-patterns.md](anti-patterns.md) for detail. In short: no horizontal slicing, no testing internals, no brittle mocks, no vague titles, no multi-behavior mega-tests, no hidden AAA, no unnecessary Jest scaffolding, no orphan convention that contradicts the repo.

## 12. Supporting Files

- [examples.md](examples.md) — naming, AAA, TDD slice, and Jest patterns.
- [checklists.md](checklists.md) — pre-flight, per-test, refactor, and PR-ready checks.
- [anti-patterns.md](anti-patterns.md) — what to reject and what to do instead.

## 13. Agent Discipline

Be **direct**, **opinionated**, and **practical**. Prefer **small, proven steps** over bulk generation. When unsure about repo norms, **look at existing tests** and **copy their shape**. When introducing the only convention in a Greenfield corner of the repo, **say so** and keep it **consistent** going forward.

---
name: prisma-testing
description: >-
  Writes and maintains Jest-based unit tests for Prisma-backed code using
  jest-mock-extended DeepMockProxy patterns, repository conventions, AAA structure,
  and vertical-slice TDD. Use when testing services, repositories, or handlers that
  use Prisma Client, mocking the database in unit tests, integration tests with a
  real DB, prisma mock setup, createMockContext, or when the user mentions Prisma
  and tests together.
---

# Prisma + Jest Testing (Mocks, Conventions, TDD)

**Primary references (read when specifics matter):**

- **Prisma:** official unit testing guide — [Unit testing | Prisma Documentation](https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing) (singleton mock, dependency injection mock, integration testing). Follow current Prisma docs for import paths (`PrismaClient` from your generated client package) and patterns.
- **Jest:** [jestjs.io](https://jestjs.io/) for runner APIs, `jest.mock`, `setupFilesAfterEnv`, async tests.

This skill adds **Prisma-specific** discipline on top of general testing hygiene: **never hit a real database in unit tests**; **mock `PrismaClient` with `jest-mock-extended`**; **align with how the repo already wires Prisma** (singleton vs injection).

### In this monorepo (LTI / Prisma in `backend/`)

- Prisma schema and client generation live under **`backend/prisma/`**; app code imports **`@prisma/client`** from the backend package context.
- **Jest** for backend: `cd backend && npm test` — align mocks with how **`backend/`** wires **`PrismaClient`** (singleton module vs dependency injection), discovered by reading source.
- **Cursor backend test workflow:** when using [`.cursor/agents/backend-test-developer.md`](../../agents/backend-test-developer.md), **unit** tests for that flow target **`backend/src/tests/tests-ics.test.ts`**—see **[`docs/backend-test-workflow.md`](../../../docs/backend-test-workflow.md)**. Prisma mocking rules in this skill still apply; only **file placement** may differ from generic colocation for that workflow.

## 1. Purpose

Equip the agent to:

- **Inspect the repository** before authoring tests (Jest vs other runners, Prisma entry points, existing mocks, placement, factories).
- **Write unit tests** that **mock Prisma Client** via **`jest-mock-extended`** (`mockDeep`, `mockReset`, `DeepMockProxy`) — **no real DB** in unit tests.
- **Respect integration-test boundaries**: real database **only** if the repo already does so **or** the user explicitly requests it.
- Enforce **AAA**, **vertical-slice TDD**, and **behavior-focused** assertions through **public** service/handler APIs.
- Avoid brittle coupling to private helpers and accidental **`.env` / DATABASE_URL** use during tests.

## 2. Mandatory: Repository Inspection First

Before writing or moving tests, discover how this codebase already works (search, read configs, open representative tests):

| Detect | Why it matters |
|--------|----------------|
| **Test runner** | If **`jest`** is in `package.json` scripts/deps, use Jest. If the project uses **Vitest** (or another runner) **without** Jest, **do not impose Jest** unless the user asked to add it — follow the **existing** runner and translate patterns conceptually (mocks still isolate Prisma). |
| **Prisma Client location** | `@prisma/client` vs custom output path in `schema.prisma` `generator client`; monorepo package boundaries |
| **Access pattern** | **Singleton** module (`import prisma from './lib/prisma'`) vs **dependency injection** (`createUser(input, { prisma })` / request `context.prisma`) |
| **Test placement** | Colocated `*.test.ts` vs `tests/`, `__tests__/`, package-local `test/` |
| **File naming** | `.test.*` vs `.spec.*` — match the majority |
| **JS vs TS** | Extensions, `ts-jest` / `babel`, types |
| **Jest config** | `jest.config.*`, `package.json` `jest`, `setupFilesAfterEnv`, `setupFiles`, `testEnvironment` |
| **Mocking style** | `jest.mock` of prisma module, manual mocks, wrapper repositories, test `context` factories |
| **Helpers** | Factories, builders, `faker`, `createMockContext`, shared `prismaMock` exports |

**Rules:**

1. **Do not invent a new convention** when a clear one exists.
2. **Follow local conventions first** (placement, naming, how Prisma is passed).
3. **Introduce a new convention** only when none exists; **explain briefly** in the user-visible response.
4. **Do not mix** singleton-style and DI-style mocking **in the same feature area** without a **documented** reason (prefer one pattern per boundary the repo already uses).

## 3. Prisma Testing Strategy: Unit vs Integration

| Layer | Database | Mocking |
|-------|----------|---------|
| **Unit tests** | **Do not connect.** Use **`jest-mock-extended`** deep mocks of `PrismaClient` (or of the injected prisma field). |
| **Integration tests** | **May** use a **real** database **if** the repository already has that pattern **or** the user explicitly asked. Otherwise **do not** silently add DB-backed suites. |

**Unit tests** must **prefer** mocking **Prisma Client** over any real I/O — this matches Prisma’s official unit testing approach.

**Integration tests** (real DB) belong **only** where the repo separates them (`integration/`, `*.integration.test.ts`, CI matrix, docker-compose test DB, etc.). Reuse existing **setup/teardown**, **migrations**, and **transaction** patterns; do not fork a second integration layout.

References: [Prisma — Unit testing](https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing), integration examples in Prisma docs / best practices.

## 4. Jest + `jest-mock-extended` for Prisma (Unit Tests)

**Requirement for unit tests in Jest repos:** use **`jest-mock-extended`** to build a **`DeepMockProxy<PrismaClient>`** so **all** model delegates (`prisma.user.findUnique`, etc.) are mockable without stubbing the entire graph by hand.

**Core practices:**

- **Deep mock** the client: `mockDeep<PrismaClient>()` (or mock the **injected** prisma property with the same depth).
- **Reset between tests:** `mockReset(prismaMock)` in `beforeEach` **for shared** mock instances (singleton pattern). Per-test fresh mocks can avoid cross-test leakage when appropriate.
- **Local behavior:** set `mockResolvedValue` / `mockRejectedValue` / `mockImplementation` **in the Arrange section** of **each** test (or in `beforeEach` only when **multiple** tests need identical safe defaults — prefer local for clarity).
- **Do not** over-mock **unrelated** modules; mock **at the Prisma boundary** (or repository interface if the repo uses one) unless the user’s architecture dictates otherwise.
- **Do not** add `jest.config.*`, `setupFilesAfterEnv`, or global setup files **unless** the request requires it **or** a Jest-based repo is **missing** essential wiring and tests cannot run — **prefer extending** existing config.

If **`jest-mock-extended`** is not present in a **Jest + Prisma** repo that already mocks Prisma, **prefer adding it** (with user-visible note) over reinventing partial stubs — unless the project bans new dev dependencies (then state the constraint).

### 4a. Singleton pattern (module imports `prisma`)

Align with Prisma docs: **`jest.mock('./client', () => ({ __esModule: true, default: mockDeep<PrismaClient>() }))`**, export **`prismaMock`**, **`mockReset(prismaMock)`** in `beforeEach`. Centralize in **`setupFilesAfterEnv`** **only** if the repository already centralizes Jest setup or repetition forces it — **do not** invent global setup for a single file without need.

### 4b. Dependency injection pattern (`prisma` in context)

Align with Prisma docs: **`createMockContext()`** returning a **`DeepMockProxy<PrismaClient>`** on `ctx.prisma` (names from your repo). **`beforeEach`** builds a **fresh** `mockCtx` when isolation demands it. Pass **`ctx`** into the function under test.

**Guardrail:** **Prefer the pattern the repo already uses.** If production uses **singleton**, tests mock the **module**. If production uses **DI**, tests pass a **mock context** — **do not** switch production architecture just to test.

## 5. Test Placement (Priority Order)

1. **Existing repository convention** (highest).
2. **Colocated** if the repo colocates — e.g. `src/services/create-user.test.ts` next to `create-user.ts`.
3. **Centralized** (`tests/unit/...`) if that is the established layout.
4. **No convention:** default **colocated** unit tests for service/domain/repository logic.

**Recommended default when nothing exists:**

- `src/services/create-user.ts`
- `src/services/create-user.test.ts`

**Integration:** only in dedicated areas the repo already uses (e.g. `tests/integration/`).

## 6. Naming Rules

**Files:** `.test.ts`, `.test.tsx`, `.test.js`, `.test.jsx` **per project**; if the repo uses `.spec.*`, **match it**.

**`describe`:** the **public** unit — module, use case, or **route/handler** name as the team names it.

**`test` / `it`:** behavioral specifications.

| Good | Bad |
|------|-----|
| `returns the created user when the input is valid` | `works` |
| `throws when the user email already exists` | `tests prisma` |
| `calls prisma.user.create with validated data` when persistence contract is what you specify | `calls internal helper` |
| `returns null when no matching row exists` | `sets variable correctly` |

**Note:** Asserting **`prisma.*` was invoked with** expected **`data` / `where`** is **valid** for **persistence orchestration** when that **is** the specified behavior — keep assertions **narrow** (avoid asserting every internal step when one behavior suffices).

## 7. AAA Structure (Required)

Every test must read as:

1. **Arrange** — inputs, **`prisma`** mock return/reject values, validation preconditions.
2. **Act** — one call to the **public** API under test.
3. **Assert** — return value, thrown error, and **intended** Prisma interaction (`toHaveBeenCalledWith` on the **mock** delegate) when that interaction **is** the contract.

Separate phases with **blank lines**; add `// Arrange`, `// Act`, `// Assert` when it helps.

**One Act** per test unless the behavior under specification is genuinely multi-step (e.g. “transactional flow visible to callers”).

## 8. TDD Workflow (Vertical Slices)

1. Identify **one** public behavior (e.g. “duplicate email rejects with Conflict”).
2. Write **one** failing test; confirm it fails for the **right** reason.
3. Implement the **minimum** production code to pass.
4. Run tests; **stay green** before refactor.
5. **Refactor only when green.**

**Reject:** bulk tests-first for the whole feature, speculative future tests, **refactor while red**, **horizontal slicing** (all mocks for all files before any logic).

## 9. Testing Philosophy

**Encourage:**

- Test through **exports** and **context** surfaces the app uses.
- Assert **observable** outcomes: results, errors, **and** Prisma delegate calls that encode **required persistence behavior** (see §10).
- Use **`Prisma`** **generated types** for variables and mock return values (`User`, `Prisma.UserCreateInput`) — **avoid** manually duplicated model shapes when generated types fit.
- **Minimal** extra mocks beyond Prisma and unavoidable boundaries.

**Discourage:**

- **Real DB in unit tests.**
- Testing **private** functions or **ORM-internals** not part of your contract.
- **Tight** coupling to **internal** helpers (mock them only when they are true boundaries).
- **Overspecified** `toHaveBeenCalledWith` when a looser **matcher** (`expect.objectContaining`) matches the **real** contract.

## 10. Assertions for Prisma-Based Code

Verify **what matters for the scenario**, not everything at once:

- **Return value** / **thrown error** to callers.
- **Branching** when `findUnique` returns `null`, `findFirst` finds nothing, or `create` raises unique constraint (simulate via **mock** `reject` or pre-call `findUnique` resolution).
- **`prisma.<model>.<method>`** received **expected** `where`, `data`, `include` — when **persistence** **is** the behavior (narrow to relevant fields).
- **Validation / mapping** **before** Prisma: assert thrown validation errors **without** requiring DB calls when invalid input should short-circuit.

**Warning:** avoid stacking **many** unrelated expectations in one test — split behaviors.

## 11. Environment and Setup Caution

- **Prisma loads `.env` by default** in app/runtime contexts. Tests may **accidentally** connect if production bootstrap runs. **Unit tests** must **not** trigger a real `PrismaClient` constructor unless explicitly in an integration suite.
- **Do not** change `.env`, `DATABASE_URL`, or Jest env **without** necessity and user visibility.
- Prefer **mocking the module** that exports the client **or** injecting the mock — over spinning up a database “just to be sure.”
- Only **add or modify** `setupFilesAfterEnv` / `jest` config when the **request** or **repo gap** clearly requires it.

## 12. Required User-Facing Output

When applying this skill, include:

1. **What behavior** is under test.
2. **Paths** of created/updated test files.
3. **Test code** (and minimal production diffs if applicable).
4. **Prisma mocking assumptions** (which delegate was stubbed, return vs reject).
5. **Singleton vs dependency injection** pattern followed.
6. **Risks:** missing `jest-mock-extended`, mixed patterns, `.env` exposure, wrong generated import path, integration vs unit mix-up.

## 13. Quality Checklist (Quick)

- [ ] Describes **behavior**, not arbitrary internals.
- [ ] Uses **public** interface (or explicit **ctx** as in app).
- [ ] Matches **repo** naming and placement.
- [ ] **Prisma Client mocked** in **unit** tests (**no real DB**).
- [ ] **Mock state reset** or fresh mocks where needed.
- [ ] **AAA** clear.
- [ ] **One behavior** per test.
- [ ] **Minimal** code for current red→green step.
- [ ] No **speculative** features.
- [ ] Would survive **refactor** of internal helpers if **API** stable.

Full lists: [checklists.md](checklists.md).

## 14. Anti-Patterns (Summary)

See [anti-patterns.md](anti-patterns.md). Highlights: real DB in unit tests, no mock reset, unrelated mocks, vague titles, mega-tests, hidden AAA, parallel folder conventions, horizontal TDD, manual types duplicating Prisma schema.

## 15. Supporting Files

- [examples.md](examples.md) — singleton vs DI, `mockReset`, assertions.
- [checklists.md](checklists.md) — pre-flight, per-test, env safety.
- [anti-patterns.md](anti-patterns.md) — reject list and alternatives.

## 16. Cross-Skill

For general Jest TDD conventions (AAA, placement defaults, Vitest warning), see [.cursor/skills/jest-testing/SKILL.md](../jest-testing/SKILL.md) when present in the project.

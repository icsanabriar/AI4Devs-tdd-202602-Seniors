# Prisma Testing Skill — Anti-Patterns

Reject these; prefer alternatives in [SKILL.md](SKILL.md) and [examples.md](examples.md). Official unit-test patterns: [Prisma docs — Unit testing](https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing).

---

## 1. Real database in unit tests

**Anti-pattern:** `DATABASE_URL` pointing at dev/staging/prod (or local Postgres) for “fast feedback” unit suites.

**Why:** Slow, flaky, shared state, destructive; violates unit isolation.

**Do instead:** **`jest-mock-extended`** deep mock; integration suite **only** where the repo already supports it.

---

## 2. Not resetting Prisma mocks

**Anti-pattern:** Shared `prismaMock` without `mockReset` / fresh context — **stale** `mockResolvedValue` and **call history** bleed across tests.

**Why:** Order-dependent failures in CI.

**Do instead:** `mockReset(prismaMock)` in `beforeEach` (singleton) **or** new `createMockContext()` per test (DI).

---

## 3. Mocking unrelated internals

**Anti-pattern:** `jest.mock` on every util **while** also mocking Prisma — duplicate **surface** and brittle order.

**Why:** Tests break when refactoring **private** code.

**Do instead:** Mock **Prisma boundary** (or repository interface); use **real** pure validators/mappers unless they are **heavy** or non-deterministic.

---

## 4. Vague or low-signal test names

**Anti-pattern:** `works`, `prisma test`, `success case`.

**Why:** Unactionable failures.

**Do instead:** **Observable** behavior: `throws when email already exists`, `returns null when not found`.

---

## 5. Multiple behaviors in one test

**Anti-pattern:** One test asserts create, update, delete, and “email format” validation.

**Why:** Unclear failures; violates single-behavior TDD slice.

**Do instead:** Split scenarios; share setup with small helpers **only** if clarity remains.

---

## 6. Hidden Arrange / Act / Assert

**Anti-pattern:** 40-line tests with interleaved mock setup and expectations.

**Why:** Reviewers cannot see the **contract** under verification.

**Do instead:** Blank lines between phases; optional `// Arrange` / `// Act` / `// Assert`.

---

## 7. Parallel testing convention

**Anti-pattern:** New `tests/prisma-unit/` while the rest of the codebase colocates `*.test.ts`.

**Why:** Navigation and tooling drift.

**Do instead:** **Match** existing placement; if introducing the **first** pattern, **state it** once and stay consistent.

---

## 8. Horizontal TDD

**Anti-pattern:** Write **all** tests for all services, then **all** implementation.

**Why:** Wrong APIs, wasted rewrites.

**Do instead:** **Vertical slices** — one behavior, one test, minimal code, green, refactor.

---

## 9. Duplicating Prisma model types by hand

**Anti-pattern:** Re-declaring `type User = { id: number ... }` alongside `@prisma/client` exports.

**Why:** Drift from schema; false confidence.

**Do instead:** Import **`User`**, **`Prisma.*`**, or generated **enums**; use **`satisfies`** where helpful.

---

## 10. Overspecified `toHaveBeenCalledWith`

**Anti-pattern:** Exact object match including irrelevant optional fields that **production** may add later.

**Why:** Brittle to harmless changes.

**Do instead:** `expect.objectContaining({ ... })` for the **contractual** subset; avoid asserting **every** key unless required.

---

## 11. Accidental `.env` in tests

**Anti-pattern:** Importing app bootstrap that instantiates **`new PrismaClient()`** in unit tests.

**Why:** Hidden DB access; env leakage.

**Do instead:** Mock the **module** that exports the singleton **or** inject the mock; integration tests **explicitly** configure DB.

---

## 12. Forcing Jest when the repo uses Vitest

**Anti-pattern:** Adding `jest` because “skill says Jest.”

**Why:** Conflicting runners and configs.

**Do instead:** If **Vitest** is standard, use **Vitest** mocking **analogues** and **same Prisma boundary** principles — or add Jest **only** if the user requests migration.

---

## 13. Mixing singleton + DI mocks in one feature

**Anti-pattern:** Some tests mock `@/lib/db`, others inject `ctx` — **inconsistent** for the same feature team.

**Why:** Confusion and duplicate utilities.

**Do instead:** **Match production** wiring per module; **do not** mix without an explicit architectural reason (documented to the user).

# Prisma Testing Skill — Checklists

References: [Prisma unit testing](https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing), [Jest](https://jestjs.io/docs/configuration).

---

## A. Repository pre-flight

- [ ] Confirmed **test runner**: Jest present vs Vitest-only vs other — **follow existing** (this skill’s Jest+mock patterns apply when **Jest** is the runner).
- [ ] Located **`schema.prisma`** and **generated client** import path (`@prisma/client` vs custom `output`).
- [ ] Classified **singleton** Prisma import vs **dependency-injected** `prisma` / `context`.
- [ ] Scanned **`**/*.{test,spec}.*`**, `__tests__`, `tests/` for placement and naming.
- [ ] Read **`jest.config.*`** / **`package.json` `jest`** for `setupFilesAfterEnv`, projects, `testEnvironment`.
- [ ] Found existing **`prismaMock`**, **`createMockContext`**, or **manual** `__mocks__`.
- [ ] Noted **`jest-mock-extended`** in `package.json` (add only when appropriate and policy allows).
- [ ] Identified **integration** test folders / scripts (real DB) vs **unit** — **do not merge** casually.
- [ ] Checked for **`DATABASE_URL`** / `.env` loading in test bootstrap — **risk** of accidental connect.
- [ ] **This monorepo:** Prisma + Jest for **`backend/`**; if implementing the **tests-ics** workflow, placement is fixed per **`docs/backend-test-workflow.md`** and **backend-test-developer** (mocking rules in this skill unchanged).

---

## B. Per unit test (Prisma + Jest)

- [ ] **No real database** for unit suite.
- [ ] **Deep mock** `PrismaClient` with **`jest-mock-extended`** (`mockDeep` / `DeepMockProxy`).
- [ ] **Reset** shared mocks (`mockReset`) or use **fresh** DI context as repo style dictates.
- [ ] Arrange sets **mockResolvedValue** / **mockRejectedValue** / **mockImplementation** for **this** scenario.
- [ ] **AAA** with blank lines; comments if helpful.
- [ ] **One behavior**; focused assertions.
- [ ] Assert **return**, **throw**, and **Prisma calls** only when part of the **contract**.
- [ ] Uses **generated Prisma types** where possible; avoids redundant manual model copies.
- [ ] Async: **`await`** / **`expect(...).rejects`** — no floating promises.

---

## C. TDD slice

- [ ] One **failing** test added for **one** behavior.
- [ ] **Minimal** production change to pass.
- [ ] **Green** before **refactor**.
- [ ] No **bulk** test-the-world-first; no **refactor on red**.

---

## D. Environment safety

- [ ] Unit path does **not** construct a real `new PrismaClient()` unintentionally.
- [ ] Did **not** change `.env` / CI env without clear need and user visibility.
- [ ] Did **not** add global Jest setup unless **needed** or repo-standard.

---

## E. Before handing off to user

- [ ] Stated **singleton vs DI** pattern used in tests.
- [ ] Listed **mock assumptions** and **integration vs unit** boundary.
- [ ] Flagged **repo mismatches** (e.g. mixed patterns, missing `jest-mock-extended`, wrong client import).

# Jest Testing Skill — Checklists

Use these as **stop gates** before sending code to the user or opening a PR. Official Jest reference: [jestjs.io](https://jestjs.io/).

---

## A. Repository pre-flight (before writing or moving tests)

- [ ] Located existing tests: glob `**/*.{test,spec}.{js,jsx,ts,tsx}` and folder patterns (`__tests__`, `tests`).
- [ ] Identified **dominant** naming: `.test` vs `.spec`.
- [ ] Confirmed **TS vs JS** and test file extensions match source areas.
- [ ] Read **`jest.config.*`** or `package.json` `jest` / `scripts.test`.
- [ ] Noted **projects** / monorepo layout (multiple Jest configs, roots).
- [ ] Checked **module system** (ESM `import` vs CJS `require`) and Jest `extensionsToTreatAsEsm`, `transform`, or `babel`/`ts-jest` usage.
- [ ] Reviewed **mocking** patterns (`jest.mock`, `__mocks__`, MSW).
- [ ] If **Vite** without Jest: flagged **Vitest** / other runners; **no blind Jest install**.
- [ ] **This monorepo:** if work is **backend** Jest, noted `backend/package.json` `"test": "jest"`; if using **backend-test-developer** workflow, confirm whether tests go to **`backend/src/tests/tests-ics.test.ts`** (see `docs/backend-test-workflow.md` and SKILL § “In this monorepo”).
- [ ] Decided placement per **Section 3** of SKILL.md (existing > colocated default > integration folders).

---

## B. Per-test quality (every `test` / `it`)

- [ ] Title states **observable behavior**, not mechanics.
- [ ] **Arrange / Act / Assert** separated by blank lines; comments if complexity warrants.
- [ ] **Single Act** unless behavior is genuinely multi-step.
- [ ] Exercises **public** API (or realistic boundary the user would use).
- [ ] Assertions match the **contract** (not incidental strings).
- [ ] Mocks limited to **necessary** boundaries; no mock-the-world.
- [ ] Async handled with **`await` / returned Promise** / `resolves` `rejects` idioms; no floating promises.
- [ ] **Timers / Date / randomness** controlled explicitly if needed; restored after (per repo).

---

## C. TDD discipline (each slice)

- [ ] Exactly **one new behavior** targeted before coding.
- [ ] Saw **red** (failure for the right reason) before green.
- [ ] **Minimal** production code to pass **that** test.
- [ ] **Green** before **refactor**; no refactor on red.
- [ ] Did **not** add speculative tests for hypothetical next tasks.

---

## D. Jest hygiene

- [ ] Matchers appropriate: `toBe` / `toEqual` / `toMatchObject` / `toStrictEqual` per [Expect](https://jestjs.io/docs/expect).
- [ ] Custom matchers in `setupFilesAfterEnv` only if repo already uses or truly needs.
- [ ] **No new** Jest config files unless required and requested or clearly necessary.
- [ ] **Snapshot** use justified; not a dump of entire large objects to dodge assertions.

---

## E. Final review (session / PR)

- [ ] Tests **survive** internal refactor (no brittle private coupling).
- [ ] File paths **consistent** with repo; no duplicate competing layouts.
- [ ] User reply includes **behavior summary**, **paths**, **assumptions**, **risks** (per SKILL.md §9).
- [ ] If a **new convention** was introduced where none existed: rationale stated briefly to the user.

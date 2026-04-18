# Jest Testing Skill — Anti-Patterns

Reject these patterns. Prefer alternatives aligned with [jestjs.io](https://jestjs.io/) and the SKILL.md workflow.

---

## 1. Horizontal slicing

**Anti-pattern:** Writing **all** tests for helpers, then all for services, then UI—before integrating behavior.

**Why it fails:** Encourages wrong abstractions, unused tests, and long red phases unrelated to user-visible behavior.

**Do instead:** **Vertical slices**—one behavior, one failing test, smallest implementation, green, refactor, repeat.

---

## 2. Testing private internals

**Anti-pattern:** Exporting or reaching into private functions, `._state`, or ES module internals to "get coverage."

**Why it fails:** Locks implementation; any refactor breaks tests even when behavior is correct.

**Do instead:** Test via **public exports** or the **same surfaces** a consumer uses; if logic deserves tests, consider extracting a **small public pure module** with a stable API.

---

## 3. Brittle mocks

**Anti-pattern:** Mocking every import; asserting exact call order between internal collaborators; reimplementing production logic in mock returns.

**Why it fails:** Tests pass when mocks are wrong; fail on harmless refactors.

**Do instead:** Mock **I/O and time**; use **real** domain code in between; prefer **contract** assertions on outputs.

---

## 4. Vague test names

**Anti-pattern:** `works`, `handles stuff`, `does the thing`, `edge case`.

**Why it fails:** Failures are unreadable in CI; next developer rewrites without knowing intent.

**Do instead:** Names that read like **specs**: **given / when / then** encoded as a single outcome string (repo style permitting).

---

## 5. Giant multi-behavior tests

**Anti-pattern:** One `test` with 40 lines, 12 assertions, three code paths.

**Why it fails:** Unclear failure diagnosis; hidden coupling; violates single-behavior focus.

**Do instead:** Split by **behavior** and **outcome**; share setup with **`beforeEach`** or small helpers **only** when it stays readable.

---

## 6. Hidden Arrange / Act / Assert

**Anti-pattern:** Dense blocks with no separation; assertions before the invoked behavior; mixed setup and act.

**Why it fails:** Reviewers cannot verify what is under test; flaky fixes guess wrong section.

**Do instead:** Blank lines between phases; **`// Arrange`**, **`// Act`**, **`// Assert`** when complexity warrants.

---

## 7. Unnecessary Jest setup / config

**Anti-pattern:** Dropping `jest.config.cjs`, `setupTests.ts`, Babel presets, or custom runners **without** a repo need.

**Why it fails:** Permanent maintenance cost; conflicts with existing toolchain (Vite, TS, ESM).

**Do instead:** Extend **existing** config; if Jest is missing, **ask** or match an existing runner (e.g. Vitest).

---

## 8. Parallel or orphan conventions

**Anti-pattern:** Introducing `*.spec.ts` in a tree that uniformly uses `*.test.ts`, or `tests/foo` while the rest is colocated.

**Why it fails:** Import path confusion; grep and tooling drift.

**Do instead:** **Follow majority** placement and naming; if Greenfield and alone, pick one scheme and document in the user reply.

---

## 9. Snapshot abuse

**Anti-pattern:** Huge snapshots of raw HTML, API JSON, or entire props trees for fast "coverage."

**Why it fails:** Noise on any change; reviewers rubber-stamp updates.

**Do instead:** Assert **meaningful** fields; small targeted snapshots for stable error messages or critical UI fragments **if** the team already values them.

---

## 10. Refactoring on red

**Anti-pattern:** "I'll clean this up" while the suite is failing.

**Why it fails:** Masks whether failure is new or old; breaks TDD feedback.

**Do instead:** **Green first**, then refactor with tests as safety net.

---

## 11. Speculative API tests

**Anti-pattern:** Tests for features not requested, guessing tomorrow's product rules.

**Why it fails:** Failing or useless tests block CI or rot silently.

**Do instead:** Implement and test **current** agreed behavior; add new tests when the behavior enters scope.

---

## 12. Ignoring repo toolchain signals

**Anti-pattern:** Installing Jest in a **Vitest** repo "because Jest is standard."

**Why it fails:** Duplicate config, slower CI, confused contributors.

**Do instead:** **Read** `package.json` scripts and deps; align with existing test runner unless the user explicitly wants migration.

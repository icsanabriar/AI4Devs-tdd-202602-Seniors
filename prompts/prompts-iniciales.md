# Prompts log

## Prompt - 2026-04-18T05:11:59Z
### Agent: backend-test-orchestrator
#### Model: Auto

@.cursor/agents/backend-test-orchestrator.md

Run the full backend unit test workflow end-to-end: apply backend-test-writer, then backend-test-developer, then backend-test-reviewer in strict order; on reviewer FAIL, loop developer → reviewer until PASS or a documented stopping point; finally write docs/backend-test-report.md exactly as specified in the orchestrator. Give a short progress summary after each phase.

---
## Prompt - 2026-04-18T05:29:20Z
### Agent: Agent
#### Model: Auto

/git-commit

---
## Prompt - 2026-04-18T06:10:05Z
### Agent: Agent
#### Model: Auto

Verify each finding against the current code and only fix it if needed.

In @.cursor/agents/backend-test-developer.md around lines 32 - 33, The markdown
link for [**`jest-testing`**] in the sentence that currently points to
(.cursor/skills/jest-testing/SKILL.md) is using a repo-root-relative path that
won't resolve from .cursor/agents; update the link target to a sibling-relative
path (e.g. ../skills/jest-testing/SKILL.md) so the link resolves from the
backend-test-developer.md location; adjust the link in the line containing the
[**`jest-testing`**] reference accordingly.

---
## Prompt - 2026-04-18T06:10:31Z
### Agent: Agent
#### Model: Auto

Verify each finding against the current code and only fix it if needed.

In @.cursor/commands/git-commit.md at line 27, The sentence discussing reviewing
the cached diff incorrectly references "step 7" for the secret rules; update
that reference to "step 5" so the guidance points to the actual secret checks.
Locate the sentence containing "`git diff --cached` and review it end-to-end
before `git commit`" and replace the mention of "step 7" with "step 5" so the
pre-commit review path correctly directs readers to the secret-rules step.

---
## Prompt - 2026-04-18T06:10:55Z
### Agent: Agent
#### Model: Auto

Verify each finding against the current code and only fix it if needed.

In @.cursor/rules/10-prompt-tracking.mdc around lines 33 - 39, The numbering gap
in the rule list should be fixed by renumbering items after "7. **File
initialization:**" so the sequence is consecutive (i.e., change "9. **Append
semantics:**" to "8. **Append semantics:**" and change "10. **Append-only:**" to
"9. **Append-only:**"); update only the numeric labels in
.cursor/rules/10-prompt-tracking.mdc around the blocks that start with "7.
**File initialization:**", "9. **Append semantics:**", and "10.
**Append-only:**" to preserve all wording and punctuation exactly while ensuring
sequential numbering for unambiguous references.

---
## Prompt - 2026-04-18T06:11:55Z
### Agent: Agent
#### Model: Auto

Verify each finding against the current code and only fix it if needed.

In @.cursor/skills/jest-testing/examples.md around lines 91 - 95, The example
uses top-level await and should be wrapped in a Jest async test; update the
snippet that calls fetchData() to be inside a test block (e.g., test('rejects on
network failure', async () => { ... })) so that await
expect(fetchData()).rejects.toThrow('network') runs inside an async test
function; reference the fetchData() call and the test(...) wrapper when making
the change.

---
## Prompt - 2026-04-18T06:12:15Z
### Agent: Agent
#### Model: Auto

Verify each finding against the current code and only fix it if needed.

In @.cursor/skills/prisma-testing/SKILL.md at line 21, The heading "In this
monorepo (LTI / Prisma in `backend/`)" is using ### under a top-level # and
should be changed to a second-level heading; update the heading token from "###
In this monorepo (LTI / Prisma in `backend/`)" to "## In this monorepo (LTI /
Prisma in `backend/`)" to restore proper markdown hierarchy and consistency.

---
## Prompt - 2026-04-18T06:12:50Z
### Agent: Agent
#### Model: Auto

Verify each finding against the current code and only fix it if needed.

In @.cursor/skills/prisma-testing/SKILL.md around lines 62 - 65, The Markdown
table with header "Layer | Database | Mocking" has rows for "Unit tests" and
"Integration tests" that only supply two pipe-separated cells, breaking
rendering; update those rows so each has three cells matching the header (e.g.,
for "Unit tests" use: Unit tests | Do not connect. Use `jest-mock-extended` deep
mocks of `PrismaClient` | (Mocking) or explicit value such as "Use deep mocks",
and for "Integration tests" use: Integration tests | May use a real database if
the repo already has that pattern or user requested | (Mocking) or explicit
value such as "Real DB or no DB"), ensuring each row contains three columns
separated by pipes to fix the malformed table.

---
## Prompt - 2026-04-18T06:13:30Z
### Agent: Agent
#### Model: Auto

Verify each finding against the current code and only fix it if needed.

In `@docs/backend-unit-tests.md` around lines 173 - 184, Update the TEST-009
description to remove `cv: {}` from the negative Arrange and instead use only
non-empty invalid CV shapes (e.g., `cv: { filePath: 1 }`) that should cause
validateCV/validateCandidateData to reject; keep a separate positive-edge test
case documenting the skip behavior when `cv` is an empty object
(Object.keys(cv).length === 0) so reviewers know the empty CV path is
intentionally skipped rather than treated as invalid.

---
## Prompt - 2026-04-18T06:15:58Z
### Agent: Agent
#### Model: Auto

Based on the last changes under @.cursor/. @prompts-iniciales.md (7-9)

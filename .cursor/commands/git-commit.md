---
name: git-commit
description: Review, stage, and commit relevant repository changes with a conventional commit message.
---

# Git Commit

Use this command when the user wants to save work to git in this repository.

## Goal

Create a safe, focused git commit for the changes the user wants to persist.

## Instructions

1. Inspect repository state before committing:
   - Run `git status`. If merge conflicts are reported, do not commit; tell the user to resolve conflicts first.
   - Run `git diff` for unstaged changes and `git log --oneline -5` to match recent commit style.
2. If the user’s intent is ambiguous (scope, whether they are closing a track, or what belongs in this commit), ask **one** clarifying question instead of guessing.
3. Determine the smallest coherent commit scope.
   - If the worktree mixes unrelated changes, do not bundle them automatically; ask whether to split commits.
4. Stage only files relevant to the requested commit.
5. Never stage or commit:
   - `.env` files, raw credential bundles, or private key files (e.g. `.pem`). Before `git commit`, review `git diff --cached` and **stop and ask the user** (do not commit) if the cached diff introduces values adjacent to secret-like identifiers (`password`, `secret`, `token`, `api_key`, `private_key`, `client_secret`, `AWS_SECRET_ACCESS_KEY`, and similar). **Stop and ask** if it adds PEM / private-key material or obvious bearer-token values. If uncertain whether something is a secret, stop and ask — do not commit.
   - Editor, OS, or ephemeral tool noise such as `.DS_Store`, `.idea/`, `.vscode/` (unless the user explicitly wants repo settings), swap/backup files, debug logs, and local-only caches unrelated to the commit. Deliberate changes under `.cursor/` (rules, skills, agents, commands) are not noise when they are in scope.
   - Unrelated changes you did not make unless the user explicitly asks for them.
6. After staging, run `git diff --cached` and review it end-to-end before `git commit`. Re-check the secret rules in step 7. If the cached diff shows **large or unexpected binary additions** (or non-text formats not part of the intended change), stop and confirm with the user before committing.
7. If staging leaves the index **empty** (nothing staged for the intended commit), do not create an empty commit; explain what is missing or unstaged.
8. Choose a conventional commit type that matches the change:
    - `docs` for documentation and ADR updates.
    - `feat` for new architecture capabilities or meaningful C4 additions.
    - `fix` for corrections to existing content.
    - `chore` for repository maintenance such as rules, skills, agents, or commands.
    - `refactor` for structural cleanup without changing meaning.
9. Draft a concise commit message in imperative mood:

```text
<type>(<scope>): <short summary>

<optional body explaining why>
```

10. Before `git commit`, verify identity: `git config user.name` and `git config user.email` must be set, non-empty, and not obvious placeholders (e.g. `Your Name`, `user@example.com`). If missing or placeholder-like, stop and tell the user to configure `user.name` / `user.email`; do not commit.
11. Create the commit. If a **git hook** fails: retry once after a straightforward fix; if it still fails, stop and report the hook output. Do **not** use `--no-verify` unless the user explicitly requests it. If `git commit` **fails for any other reason** (e.g. merge state, aborted message editor, permissions), stop, show the error output, and do not silently retry unless the fix is obvious and safe.
12. Run `git status` again and confirm the commit succeeded.

## Rollback guidance

- If the user asks to undo a commit that has **not** been pushed, suggest `git reset --soft HEAD~1` (preserves changes in the working tree).
- If the commit **has** been pushed, suggest `git revert HEAD` to create a reversal commit — never rewrite shared history without explicit user consent.
- If the commit message is wrong but the commit has not been pushed, `git commit --amend` is acceptable only if the user requests it.

## Troubleshooting & recovery

- **Empty index (nothing staged):** Run `git status` and `git diff` — you intended files may be unstaged. Stage with `git add <paths>` or (only if the user asked for a broad stage) `git add -A`. Do not run `git commit` with an empty index.
- **Staged the wrong files:** `git reset` (unstage) or `git reset HEAD <path>`, re-stage. Use `git diff --cached` before every commit to verify.
- **Staged only part of a file:** `git add -p <path>` to add/remove hunks; or `git reset -p` to unstage selected hunks.
- **On the wrong branch (not yet committed, dirty tree):** `git status`; `git stash push -m "wip"`; `git switch <branch>`; `git stash pop` (resolve conflicts if any) — or commit on the current branch and `git cherry-pick` if that matches user intent; ask if ambiguous.
- **Committed on wrong branch, not pushed:** `git switch <correct-branch>`; `git cherry-pick <sha>`; on the old branch, `git reset --hard HEAD~1` (only with user agreement — destructive to that branch’s tip). Safer: user confirms before hard reset.
- **Accidental empty commit:** If `git commit` created an empty commit, `git reset --soft HEAD~1` to undo it while keeping the tree, then fix staging.
- **Hook blocks commit:** One retry after fixing the issue in the same diff; if still blocked, show full hook output; never `--no-verify` without explicit user request.
- **Merge in progress (cannot commit):** `git status` will show a merge; finish with merge resolution or `git merge --abort` *only* if the user wants to abort. Do not commit a merge until conflicts are **resolved and staged**.

## Expected behavior

- Prefer one focused commit over one large mixed commit.
- Do not push unless the user explicitly asks.
- If the index is empty or there is nothing to commit for the requested scope, say so clearly; do not create an empty commit.
- Combine unstaged `git diff` with post-staging `git diff --cached` so the commit matches intent and excludes accidents.

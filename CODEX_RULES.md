# CODEX_RULES.md

## Prime Rule

Codex must behave like a disciplined engineer, not a free-form coder.

Every task must follow:

`latest main → fresh branch → scoped change → checks → PR → merge → delete branch`

## Branch Rules

1. Always start from the latest GitHub `main`.
2. Before coding, confirm the current branch.
3. Pull/update latest `main` before creating a task branch.
4. Create one fresh branch per task.
5. Never continue from old Codex branches unless explicitly instructed.
6. Never stack unrelated work into an existing PR.

## Scope Rules

7. One task = one branch = one PR.
8. Only modify files listed in the task prompt.
9. If another file must be changed, stop and explain why before editing.
10. Do not refactor, rename, clean up, or optimize unrelated code.

## Verification Rules

11. Before PR, run available checks.
12. Before PR, output:
   - current branch
   - changed file list
   - checks run
   - any check failures
13. Create PR only if changed files match the allowed scope.

## PR Rules

14. PR title must be specific.
15. PR description must include:
   - summary
   - changed files
   - tests/checks
16. After PR is merged, the branch should be deleted.

---
name: raise-pr
description: Prepare and open a pull request for Command Center Web — self-review the diff, run the gates, write the description with the KBHH key, satisfy the PR template. Use when work is finished, or for "raise a PR", "ready to push", or a commit message / PR description.
---

# Raising a PR

## 1. Self-review

```bash
git diff development...HEAD
```

Strip: `console.log`, commented-out code, `debugger`, placeholder TODOs, test fixtures,
hardcoded emails/IDs, stray `src/ui-kit/` edits, and **reformatting noise** (several files
are 2-space against a 4-space config — don't let `--write` sweep one into your diff).

New deps in `package.json`? Justify explicitly. A widened `persistConfig.whitelist`, a
changed `sonar-project.properties` exclusion, or edits to `automation_scripts/` need a
deliberate conversation, not a drive-by.

## 2. Gates — all three

```bash
npm run lint && npm test && npm run build-dev
```

The PR template makes you attest the build compiled locally. Don't tick it on a build you
didn't run. Targeting `qa`/`uat`? Build that mode instead.

## 3. Commit & push

```bash
git checkout -b feature/KBHH-1234-short-summary    # or bugfix/ | enhancement/
git add <specific paths>                            # not `git add .`
git commit -m "KBHH-1234: add persona mapping table to forum management"
git push -u origin feature/KBHH-1234-short-summary
```

Key prefix links the ticket. Imperative, under 72 chars. One logical change per commit.

## 4. PR

Base is **`development`** (`qa`/`uat` are promotion branches; a merge to any of them deploys
via the Katalyst workflow). Title `KBHH-1234: <summary>`.

```markdown
## What & why
KBHH-1234 — <the change and its user-visible outcome. For a bug, the root cause, not the symptom.>

## Changes
- `path` — ...

## How to test
1. <steps a reviewer can follow, including the failure/empty path>

## Not covered
- <out of scope, with a ticket ref if one exists>

## Local Build Verification

> [!IMPORTANT]
> Please confirm you have verified your changes locally before submitting this PR.

- [x] **Local Build:** I have run the build command on my local machine and confirmed it compiles successfully without any errors.
```

```bash
gh pr create --base development --title "KBHH-1234: ..." --body-file <file>
```

## 5. Reviewers & Jira

`.github/CODEOWNERS` is one catch-all rule (`*` → six owners), so there are no path-specific
reviewers — pick whoever actually knows the area.

Jira write-back only on explicit go-ahead. House style is terse ("Code changes have been
deployed to dev, so moving this to no approval"). Fetch available transitions rather than
guessing an ID; never move to Done/Closed or reassign unprompted.

## Checklist

- [ ] Diff self-reviewed; no debug code, no incidental reformatting
- [ ] No new dependencies (or justified)
- [ ] lint + test + build-dev pass
- [ ] Exercised in the browser incl. error/empty paths
- [ ] New env vars in **all four** `.env.*`; new strings in **all four** locales
- [ ] Branch + commits carry the KBHH key; base is `development`
- [ ] Local Build checkbox honestly ticked

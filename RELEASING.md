# Release Guide

**Automated releases with release-please. Publish to NPM on demand.**

This guide covers the release process for Archlette maintainers.

---

## Table of Contents

- [Automated Release Process](#automated-release-process)
- [Versioning Strategy](#versioning-strategy)
- [Pre-Release Checklist](#pre-release-checklist)
- [Manual Release (Emergency)](#manual-release-emergency)
- [NPM Token Management](#npm-token-management)
- [Troubleshooting](#troubleshooting)

---

## Automated Release Process

Archlette uses **release-please** to automate version bumps, changelog updates, and NPM publishing.

### The Release Flow

```
1. Merge PR to main
   ↓
2. release-please opens/updates "Release PR" automatically
   - Bumps version in package.json
   - Updates CHANGELOG.md
   - Groups commits by type (Features, Bug Fixes, etc.)
   ↓
3. Review the Release PR
   - Check version bump is correct
   - Review changelog entries
   - Verify CI passes
   ↓
4. Merge Release PR when ready
   ↓
5. Automated:
   - Git tag created (v0.2.0)
   - CD workflow triggers
   - NPM publish with provenance
   - GitHub Release created
```

### Finding the Release PR

After merging to `main`, look for:

- **PR title**: `chore(main): release X.Y.Z`
- **Author**: `github-actions[bot]`
- **Label**: `autorelease: pending`

### The Release PR Accumulates Changes

**The release PR stays open and updates itself:**

```
Week 1: Merge feat → Release PR shows v0.2.0
Week 2: Merge feat + fix → Release PR updates to v0.3.0
Week 3: Ready to release → Merge Release PR → Publish!
```

Each new commit to `main` updates the open release PR with:

- Adjusted version bump (more features = higher version)
- Updated changelog entries
- Refreshed commit list

### When to Merge the Release PR

Merge when:

- ✅ You have enough changes for a meaningful release
- ✅ All CI checks pass
- ✅ You've tested the changes
- ✅ Documentation is up to date
- ✅ You're ready for it to go live on NPM

**Common patterns:**

- **Weekly releases** — Merge every Friday afternoon
- **Feature-based** — Merge after completing a milestone
- **Bugfix releases** — Merge immediately for critical fixes
- **Monthly releases** — First Monday of each month

**No pattern is required** — release when you're ready.

---

## Versioning Strategy

Archlette follows [Semantic Versioning](https://semver.org/) (semver):

```
MAJOR.MINOR.PATCH
  │     │     │
  │     │     └─ Bug fixes (backwards compatible)
  │     └─────── New features (backwards compatible)
  └───────────── Breaking changes (incompatible API)
```

### Commit Types → Version Bumps

Based on [Conventional Commits](https://www.conventionalcommits.org/):

| Commit Prefix      | Version Bump | Example       |
| ------------------ | ------------ | ------------- |
| `fix:`             | PATCH        | 0.1.0 → 0.1.1 |
| `feat:`            | MINOR        | 0.1.0 → 0.2.0 |
| `BREAKING CHANGE:` | MAJOR        | 0.1.0 → 1.0.0 |
| `chore:`, `docs:`  | None         | Accumulates   |

### Examples

**Patch release (0.1.0 → 0.1.1):**

```bash
fix: resolve path traversal in basic-node extractor
fix: correct Structurizr DSL escaping for quotes
```

**Minor release (0.1.0 → 0.2.0):**

```bash
feat: add basic-python extractor
feat: add GraphQL schema extractor
docs: update security guide
```

**Major release (0.1.0 → 1.0.0):**

```bash
feat!: redesign plugin API for better extensibility

BREAKING CHANGE: Plugin interface now requires async default export.
Plugins must be updated to use `export default async function`.
```

### Pre-1.0.0 Versioning

While in **0.x.x** (pre-stable):

- Breaking changes → MINOR bump (0.1.0 → 0.2.0)
- Features → MINOR bump (0.1.0 → 0.2.0)
- Fixes → PATCH bump (0.1.0 → 0.1.1)

**When to go 1.0.0:**

- API is stable
- Documentation is complete
- Used in production by multiple projects
- Ready to commit to semver guarantees

---

## Pre-Release Checklist

Before merging the release PR:

### Code Quality

- [ ] All CI checks pass (lint, typecheck, tests)
- [ ] No known critical bugs
- [ ] Security vulnerabilities addressed
- [ ] License compliance checked (`npm run licenses:check`)

### Documentation

- [ ] README.md is up to date
- [ ] CHANGELOG.md entries are accurate (review release PR)
- [ ] Breaking changes documented clearly
- [ ] Migration guide provided (if breaking changes)
- [ ] Architecture docs regenerated (`npm run aac:all`)

### Testing

- [ ] All tests pass (`npm test`)
- [ ] Manual smoke test:
  ```bash
  npm run build
  npm run pack:test
  # Test the packed tarball locally
  ```
- [ ] Test in a separate project:
  ```bash
  npm pack
  # In another project:
  npm install ../archlette/chrislyons-dev-archlette-X.Y.Z.tgz
  ```

### Version Verification

- [ ] Version bump is correct (check package.json in release PR)
- [ ] Version matches changelog entry
- [ ] Git tag will be created correctly (v0.2.0 format)

### NPM Preparation

- [ ] NPM token is valid (check expiration date)
- [ ] Package.json metadata is correct
- [ ] Files included in package are correct (`npm run pack:test`)

---

## Manual Release (Emergency)

**Use only if release-please is broken or you need immediate publish.**

### Step 1: Bump Version Manually

```bash
# Choose one:
npm version patch  # 0.1.0 → 0.1.1
npm version minor  # 0.1.0 → 0.2.0
npm version major  # 0.1.0 → 1.0.0
```

This updates `package.json` and creates a git tag.

### Step 2: Update CHANGELOG.md

Manually add entry:

```markdown
## [0.2.0] - 2025-01-15

### Added

- New Python extractor for analyzing Python codebases

### Fixed

- Path traversal vulnerability in file validation

[0.2.0]: https://github.com/chrislyons-dev/archlette/compare/v0.1.0...v0.2.0
```

### Step 3: Commit and Push

```bash
git add CHANGELOG.md
git commit -m "chore: release v0.2.0"
git push origin main --tags
```

The tag push triggers `.github/workflows/cd.yml` → NPM publish.

### Step 4: Create GitHub Release

```bash
gh release create v0.2.0 --title "v0.2.0" --notes-file RELEASE_NOTES.md
```

Or manually at: https://github.com/chrislyons-dev/archlette/releases/new

---

## NPM Token Management

### Token Type

Use **Granular Access Token** (not Classic Automation Token).

**Settings:**

- **Expiration**: 1 year
- **Packages**: `@chrislyons-dev/archlette`
- **Permissions**: Read and write
- **IP restrictions**: None (GitHub Actions IPs rotate)

### Token Rotation Schedule

**Tokens expire!** Set calendar reminders:

- **2 weeks before expiration**: Regenerate token
- **1 week before expiration**: Update GitHub Secret

### Rotation Process

1. **Generate new token**:
   - Go to https://www.npmjs.com/settings/tokens
   - Click "Generate New Token" → "Granular Access Token"
   - Configure same permissions as before
   - Set expiration 1 year from now
   - Copy token (you won't see it again!)

2. **Update GitHub Secret**:

   ```bash
   gh secret set NPM_TOKEN
   # Paste token when prompted
   ```

   Or manually:
   - Go to https://github.com/chrislyons-dev/archlette/settings/secrets/actions
   - Edit `NPM_TOKEN`
   - Paste new token
   - Save

3. **Delete old token**:
   - Go to https://www.npmjs.com/settings/tokens
   - Revoke the old token

4. **Test token**:
   - Trigger a manual workflow run
   - Or wait for next release to verify

### Token Expiration Warning

If publish fails with:

```
npm ERR! code E401
npm ERR! Unable to authenticate
```

**Token expired.** Regenerate immediately (see above).

---

## Troubleshooting

### Release PR Not Created

**Symptom**: No PR appears after merging to `main`.

**Solutions**:

1. **Check permissions**:
   - Workflow needs `contents: write` and `pull-requests: write`
   - Already configured in `.github/workflows/release-please.yml`

2. **Check commit history**:
   - Needs at least one releasable commit (`feat:`, `fix:`) since last tag
   - `chore:` and `docs:` alone won't trigger a release

3. **Check branch protection**:
   - Bot must be allowed to create PRs on `main`
   - Go to Settings → Branches → `main` → Allow bot PRs

4. **Check logs**:
   ```bash
   gh run list --workflow=release-please.yml
   gh run view <run-id> --log
   ```

### Release PR Won't Update

**Symptom**: New commits to `main` don't update the release PR.

**Solutions**:

1. **Close and reopen the PR** (rare, but can fix sync issues)
2. **Check workflow logs** for errors
3. **Verify commit follows conventional format**

### CD Workflow Fails

**Symptom**: Tag created but NPM publish fails.

**Common causes**:

1. **NPM token expired** → Regenerate token
2. **CI checks failed** → Fix tests/lint before releasing
3. **Network issue** → Re-run workflow
4. **Version already exists on NPM** → Bump version manually

**View logs**:

```bash
gh run list --workflow=cd.yml
gh run view <run-id> --log
```

### Wrong Version Bump

**Symptom**: Release PR shows v0.2.0 but you expected v0.1.1.

**Cause**: Commits include `feat:` (triggers minor bump).

**Fix**:

1. Close release PR
2. Edit commit messages or squash commits
3. Re-push to main
4. New release PR will be created with correct version

### Accidental Publish

**Symptom**: Merged release PR by mistake.

**Actions**:

1. **Immediately deprecate on NPM**:

   ```bash
   npm deprecate @chrislyons-dev/archlette@0.2.0 "Accidental publish, use 0.1.1 instead"
   ```

2. **Publish correct version**:
   - Revert the merge commit
   - Fix issues
   - Create new release

3. **Document in CHANGELOG**:

   ```markdown
   ## [0.2.1] - 2025-01-15

   ### Fixed

   - Reverted accidental v0.2.0 release
   ```

---

## Release Cadence Recommendations

### For Early Development (0.x.x)

**Weekly or bi-weekly releases:**

- Merge release PR every Friday
- Gives users frequent updates
- Builds confidence in release process

### For Stable Releases (1.x.x+)

**Monthly releases + hotfixes:**

- Scheduled release: First Monday of month
- Hotfix releases: As needed for critical bugs
- Major releases: Quarterly with migration guides

### For Critical Fixes

**Immediate release:**

- Security vulnerabilities
- Data loss bugs
- Broken installations

Merge release PR immediately, don't wait for scheduled release.

---

## Summary

**Normal release flow:**

1. Merge PRs to `main` with conventional commits
2. release-please opens/updates release PR
3. Merge release PR when ready → automatic publish

**Emergency manual release:**

1. `npm version patch/minor/major`
2. Update CHANGELOG.md
3. `git push --tags`

**NPM token:**

- Regenerate yearly
- Set calendar reminder
- Takes 2 minutes

**Questions?**

- Check workflow logs: `gh run list`
- Review GitHub Actions: https://github.com/chrislyons-dev/archlette/actions
- See CONTRIBUTING.md for development workflow

---

Ship with confidence. 🚀

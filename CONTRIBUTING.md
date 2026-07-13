# Contributing

## Commit messages

This repository uses [Conventional Commits](https://www.conventionalcommits.org/). Every
commit message must look like:

```
<type>(<optional scope>): <description>
```

Allowed types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `build`, `perf`,
`style`.

Examples:

```
feat(frontend): add booking dialog with validation
feat(backend): implement booking calendar API
fix(backend): reject bookings outside the 14-day window
docs: add e2e test scenarios
ci: add commit-message linting
```

Breaking changes: add `!` after the type/scope (`feat!: ...`) or a `BREAKING CHANGE:`
footer.

### Why this matters here specifically

[release-please](https://github.com/googleapis/release-please) reads commit messages on
`main` to decide the next version number and to generate `CHANGELOG.md`. `feat` triggers
a minor bump, `fix` a patch bump, other types are changelog-only or invisible depending on
configuration. A non-conventional commit doesn't break anything — it just won't be
reflected in the changelog or version.

### Enforcement

Pull requests are linted automatically by `.github/workflows/commitlint.yml`, which checks
every commit on the PR branch. **If this repository's merge button is set to "Squash and
merge"**, the commit that actually lands on `main` is the PR *title* (GitHub uses it as
the squash commit subject by default), not any of the individual commits — make sure your
PR title also follows the convention above, since that's what release-please and the
changelog will actually see.

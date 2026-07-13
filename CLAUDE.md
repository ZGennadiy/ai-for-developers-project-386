# CLAUDE.md

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat`, `fix`,
`docs`, `chore`, `refactor`, `test`, `ci`, `build`, `perf`, `style`, optional scope). See
[CONTRIBUTING.md](CONTRIBUTING.md) for details and rationale — `release-please` parses
these on `main` to generate the changelog and version bump. If a PR will be squash-merged,
make sure the PR title itself is a valid Conventional Commit, since that title is what
ends up as the commit on `main`.

# First Release Checklist

## 1) Local Verification

Run from repository root:

```bash
npm install
npm run lint
npm run typecheck
npm run audit:prod
npm test
npm run test:cli-e2e
npm run smoke:consumer
```

## 2) Automatic Version Policy

No manual version step is required.

On every push to `main`, the release workflow runs this policy automatically:

- `x.0.0` -> `x.1.0`
- `x.1.0` -> `x.2.0`
- ...
- `x.9.0` -> `x+1.0.0`

Version bump script location:

- `scripts/bump-release-version.mjs`

## 3) Commit Sequence

```bash
git add .
git commit -m "feat: initial public release of complaint-request-widget"
git push origin main
```

## 4) Configure Publish Secrets

GitHub repository secrets required:

- `NPM_TOKEN`: npm automation token with publish rights.
- `GITHUB_TOKEN`: provided automatically by GitHub Actions.

Recommended repository protections:

- Protect `main` branch and require CI checks.
- Allow GitHub Actions bot to push version bump commits for release workflow.

## 5) Publish Paths

Option A: Fully automatic on push to main

- Push commits to `main`.
- Workflow runs checks, bumps version, commits version bump, tags, and publishes.

Option B: Manual publish from local machine

```bash
npm run build
npm publish --access public
```

For scoped package access, ensure npm scope visibility is public.

## 6) Post-Publish Verification

```bash
npm view @zerotrace-solutions/complaint-request-widget version
npx @zerotrace-solutions/complaint-request-widget init --help
```

Then test install in a clean host project.

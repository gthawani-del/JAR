# Dependency Readiness Notes

The repository uses npm with exact public-package versions and a project `.npmrc` that points to the public npm registry.

The previous install blocker was resolved during the readiness-fix pass: `npm install` now completes and `package-lock.json` is committed for reproducible installs.

Run locally or in CI:

```bash
npm install
npm run build
npm run lint
npm run typecheck
```

No private packages or private registries are required.

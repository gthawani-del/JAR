# Dependency Readiness Notes

The repository uses npm with exact public-package versions and a project `.npmrc` that points to the public npm registry.

During Codex verification, the shell environment injected these npm environment settings:

```text
http-proxy = http://proxy:8080
https-proxy = http://proxy:8080
```

Requests through that proxy to `https://registry.npmjs.org/` returned `403 Forbidden`, including `npm ping --registry=https://registry.npmjs.org/`. Running without the proxy could not resolve the registry host in this container. This indicates the remaining install blocker is the Codex network/proxy environment rather than the repository package configuration.

On a normal local machine or Vercel environment with public npm registry access, run:

```bash
npm install
npm run build
npm run lint
npm run typecheck
```

No private packages or private registries are required.

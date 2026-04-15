# Known Surprises

This file tracks repository-specific confusion points that caused agent mistakes.

## Entry Criteria

Add an entry only if all are true:

- It is specific to this repository (not generic advice).
- It is likely to recur for future agents.
- It has a concrete mitigation that can be followed.

If uncertain, ask the developer before adding an entry.

## Entry Template

```md
### [Short title]

- **Date:** YYYY-MM-DD
- **Observed by:** agent name or contributor
- **Context:** where/when it happened
- **What was surprising:** concrete unexpected behavior
- **Impact:** what went wrong or could go wrong
- **Mitigation:** exact step future agents should take
- **Status:** confirmed | superseded
```

## Entries

### 5chan patches its installed hooks tarball instead of using the local hooks repo

- **Date:** 2026-04-15
- **Observed by:** Codex
- **Context:** Debugging strict `{name, publicKey}` community refs and the temporary `scripts/patch-bitsocial-react-hooks-esm.cjs` workaround
- **What was surprising:** 5chan does not consume the nearby `/Users/Tommaso/Desktop/bitsocial/bitsocial-react-hooks` checkout; `package.json` installs a pinned GitHub tarball of `@bitsocialnet/bitsocial-react-hooks` and then mutates its `dist/` files in `postinstall`.
- **Impact:** Agents can wrongly assume local hooks source changes are already active in 5chan, or treat the postinstall patch as app logic instead of a temporary package-level workaround.
- **Mitigation:** Before debugging hooks behavior from 5chan, check `package.json` to see whether the app points at a tarball commit or a local path. If `scripts/patch-bitsocial-react-hooks-esm.cjs` is involved, fix the underlying issue in `bitsocial-react-hooks`, rebuild its `dist/`, update 5chan to the fixed commit/path, and then remove the patch script.
- **Status:** confirmed

### Portless breaks Windows installs

- **Date:** 2026-03-04
- **Observed by:** Codex
- **Context:** GitHub Actions `Test Windows` dependency install on `windows-2022`
- **What was surprising:** `portless@0.5.2` is a local dev-only tool, but keeping it in `devDependencies` makes `yarn install` fail on Windows because the package declares `win32` unsupported.
- **Impact:** Windows CI fails before build steps run, even though the app does not need `portless` there.
- **Mitigation:** Keep `portless` in `optionalDependencies` and make `yarn start` fall back to direct `vite` startup when `portless` is unavailable.
- **Status:** confirmed

### Do not add plebbit-js directly for Electron RPC

- **Date:** 2026-03-07
- **Observed by:** Codex
- **Context:** Adding `knip` exposed `electron/start-plebbit-rpc.js` importing `@plebbit/plebbit-js/rpc` as an unlisted dependency.
- **What was surprising:** Even though that file imports `@plebbit/plebbit-js` directly, repository policy is to depend only on `@bitsocialnet/bitsocial-react-hooks` and use its transitive copy of `plebbit-js`.
- **Impact:** Agents may “fix” the unlisted import by adding `@plebbit/plebbit-js` to `package.json`, which violates project policy.
- **Mitigation:** Do not add `@plebbit/plebbit-js` to `package.json` for this repo. If `knip` flags `electron/start-plebbit-rpc.js`, handle it with a targeted `ignoreIssues` entry instead.
- **Status:** confirmed

### Electron packaging can ship a broken `better-sqlite3` binary

- **Date:** 2026-03-17
- **Observed by:** Codex
- **Context:** Investigating the `v0.7.1` macOS arm64 DMG after the app showed a live IPFS node but never loaded boards or comments.
- **What was surprising:** The packaged app can start IPFS successfully while `electron/start-plebbit-rpc.js` loops forever because `/Applications/5chan.app/.../better_sqlite3.node` was built for plain Node 22 (`NODE_MODULE_VERSION 127`) instead of Electron 36 (`NODE_MODULE_VERSION 135`).
- **Impact:** The local RPC server on `ws://localhost:9138` never starts, so the desktop app cannot load boards, posts, or comments even though node stats look healthy.
- **Mitigation:** Before any Electron package/build job, run `yarn electron:prepare-package` so `better-sqlite3` is rebuilt for Electron and immediately verified via `ELECTRON_RUN_AS_NODE=1 electron`.
- **Status:** confirmed

### Plain Vite fallback used to hard-fail on port 1355

- **Date:** 2026-03-30
- **Observed by:** Codex
- **Context:** Running `PORTLESS=0 yarn start` while another local service already owned port `1355`
- **What was surprising:** The non-Portless dev fallback forced Vite onto `5chan.localhost:1355` with `--strictPort`, so the fallback path could fail immediately even though the main Portless flow is collision-safe.
- **Impact:** Contributors could lose the fallback dev path or interrupt their startup flow when `1355` was already busy.
- **Mitigation:** Keep the fallback behind `scripts/start-dev.js`, which now probes from `1355` upward and starts Vite on the next free port instead of exiting.
- **Status:** confirmed

### Fixed Portless app names collide across 5chan worktrees

- **Date:** 2026-03-30
- **Observed by:** Codex
- **Context:** Starting `yarn start` in one 5chan worktree while another 5chan worktree was already serving through Portless
- **What was surprising:** Using the literal Portless app name `5chan` in every worktree makes the route itself collide, even when the backing ports are different, so the second process fails with `"5chan.localhost" is already registered`.
- **Impact:** Parallel 5chan branches can block each other even though Portless is meant to let them coexist safely.
- **Mitigation:** Keep Portless startup behind `scripts/start-dev.js`, which now uses a branch-scoped `*.5chan.localhost:1355` route outside the canonical case and automatically increments a `-2`, `-3`, ... suffix when that branch-scoped route is already occupied.
- **Status:** confirmed

### Toolchain model names are not interchangeable

- **Date:** 2026-04-08
- **Observed by:** contributor + Codex
- **Context:** Reviewing repo-managed agent configs under `.codex/agents`, `.cursor/agents`, and `.claude/agents`
- **What was surprising:** `composer-2` is only available for Cursor in this repo, while Codex agents using `gpt-5.3-codex` or `gpt-5.3-codex-spark` perform poorly enough that they should not be configured by default.
- **Impact:** Agents can silently inherit invalid or weak model settings, leading to broken subagent runs or degraded implementation quality.
- **Mitigation:** Keep `.cursor` agent configs on Cursor-supported models only, never use `composer-2` in `.claude`, and standardize `.codex/agents/*.toml` on `gpt-5.4` unless a contributor explicitly requests an override.
- **Status:** confirmed

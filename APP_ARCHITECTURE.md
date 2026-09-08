# LD Context Demo — Architecture Reference

Agent-oriented overview of the demo app. Live deployment: https://ld-context-demo.vercel.app/

## Purpose

Public LaunchDarkly demo for **context management** and **feature flag evaluation**. Used in recordings, workshops, and sales demos to show:

- Multi-context identity (user + anonymous)
- Attribute-based targeting (`customerStatus`, private `email`)
- Real-time flag evaluation with reasons
- Observability and session replay via LD plugins

## LaunchDarkly project

| Setting | Value |
|---------|-------|
| Project key | `context-management-demo` |
| Client-side ID env var | `REACT_APP_LD_CLIENT_ID` (in `.env` / Vercel) |
| Code references | GitHub Action syncs `durw4rd/ld-context-demo` on push |

## Context lifecycle

```mermaid
stateDiagram-v2
  [*] --> Anonymous: page load no cookie
  Anonymous --> MultiContext: login
  MultiContext --> Anonymous: logout
  Anonymous --> Anonymous: regenerate anonymous key
  MultiContext --> MultiContext: regenerate anonymous key
```

### Anonymous (logged out)

```json
{
  "kind": "anonymousUser",
  "key": "<uuid from sessionStorage>",
  "anonymous": true
}
```

### Logged in (multi-context)

```json
{
  "kind": "multi",
  "user": {
    "key": "<username>",
    "name": "<username>",
    "email": "<username>@example.com",
    "customerStatus": "gold | bronze",
    "_meta": { "privateAttributes": ["email"] }
  },
  "anonymousUser": {
    "key": "<uuid>",
    "anonymous": true
  }
}
```

### Demo conventions

- Any username/password works for login (no real auth).
- Username **`Michal`** → `customerStatus: "gold"`; all others → `"bronze"`.
- Email is synthetic: `{username}@example.com`, marked private so it is not sent in LD event payloads.
- Anonymous user key persists in `sessionStorage` (`ld_anonymous_user_key`) across reloads.
- Logged-in user persists via `js-cookie` (`user`, 1-day expiry).

## Feature flags in code

| Flag key | Type | UI effect |
|----------|------|-----------|
| `release-shiny-banner` | boolean | Fixed promo banner at top |
| `show-newsletter-signup` | boolean | Newsletter signup bar |
| `create-user-button-colour` | string | `"magenta"` → danger button (LD pink); `"cyan"` → success button (LD cyan) |
| `app-logo` | string | Header accent icon: `moon`, `star`, or `rocket` (default) |

Flags are read via typed variation hooks (`useBoolVariation`, `useStringVariation`) in [`src/App.jsx`](src/App.jsx). All flags are listed in `AllFlagsDisplay` with values and evaluation reasons.

## SDK configuration

Initialized in [`src/main.jsx`](src/main.jsx) via `createLDReactProvider` from `@launchdarkly/react-sdk` v4:

| Option | Value | Purpose |
|--------|-------|---------|
| (localStorage cache) | default in v4 | SDK caches flags automatically; do **not** pass `bootstrap: 'localStorage'` (v3 magic string — in v4 it is treated as literal bootstrap data) |
| `withReasons` | `true` | Expose why each flag evaluated (v4 name; replaces v3 `evaluationReasons`) |
| `applicationInfo.id` | `"ld-context-demo"` | Application metadata (v4 name; was `application` in v3) |
| `applicationInfo.version` | `"1.0"` | Matches observability plugin version |

Init loading/error states are handled in [`src/App.jsx`](src/App.jsx) via `useInitializationStatus()` (`initializing`, `complete`, `timeout`, `failed`).

Typed variation hooks send evaluation events automatically in v4. The `allFlags()` table in `AllFlagsDisplay` does not emit analytics events (v4 JS SDK behavior).

### Live Events in the LD UI

Client SDKs primarily send **`summary`** events (aggregated evaluation counts), not individual **`feature`** events, unless:

- You enable **Debug** on a flag in the LD UI (30-minute full-fidelity window), or
- The flag has **Send detailed event information** / experiment tracking enabled

In **Live Events**, filter by **Flags** and include **Summary** events — not only Feature or Custom/Telemetry. Observability plugin errors appear under custom/telemetry keys (`$ld:telemetry:*`), which is separate from flag analytics.

### Plugins

| Plugin | Package | Notes |
|--------|---------|-------|
| `FlagOverridePlugin` | `@launchdarkly/toolbar/plugins` | Dev flag overrides |
| `EventInterceptionPlugin` | `@launchdarkly/toolbar/plugins` | Dev event inspection |
| `Observability` | `@launchdarkly/observability` | Errors, logs, traces |
| `SessionReplay` | `@launchdarkly/session-replay` | Session recording (`privacySetting: strict`) |

LD Toolbar (`useLaunchDarklyToolbar`) is always enabled, including production deploys, so the live demo can use flag overrides and event inspection.

**Note:** `@launchdarkly/toolbar@2.3.1` declares a peer dependency on `launchdarkly-js-client-sdk` v3.x. The app uses `@launchdarkly/js-client-sdk` v4 via `@launchdarkly/react-sdk`. npm may warn about the peer mismatch; re-test when a v4-compatible toolbar is released.

## Key files

| File | Responsibility |
|------|----------------|
| [`src/main.jsx`](src/main.jsx) | SDK init, default context from cookie, plugin registration |
| [`src/App.jsx`](src/App.jsx) | Login/logout, `identify()` calls, context display, promotional UI |
| [`src/components/AllFlagsDisplay.jsx`](src/components/AllFlagsDisplay.jsx) | All flags table with `variationDetail()` reasons |
| [`src/index.css`](src/index.css) / [`src/App.css`](src/App.css) | LaunchDarkly 2026 brand tokens and component styles |
| [`src/brand/tokens/`](src/brand/tokens/) | Vendored LD design tokens (colors, Tailwind preset) |
| [`.github/workflows/action.yml`](.github/workflows/action.yml) | Code references sync on push |
| [`.launchdarkly/coderefs.yaml`](.launchdarkly/coderefs.yaml) | Optional camelCase flag key aliases (code uses exact LD keys) |

## Deployment

- **Host**: Vercel (`https://ld-context-demo.vercel.app/`)
- **Branch**: `main` on `durw4rd/ld-context-demo`
- **Build**: `npm run build` (Vite → `dist/`)

## Dead / unused code

- [`src/utils/firebaseConfig.js`](src/utils/firebaseConfig.js) — Firebase config exists but is not imported anywhere.

## Code references setup

Already configured in-repo. Manual verification:

1. GitHub repo secret `LD_ACCESS_TOKEN` with write access to `code-reference-repository`
2. Confirm project key `context-management-demo` matches the LD project
3. Push to `main` and verify the Actions workflow succeeds
4. In LD UI → flag → Code references, confirm repo links appear

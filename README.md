# LaunchDarkly Context Demo

A live demo app for showing how LaunchDarkly **contexts** and **feature flags** work together.

**Live demo:** https://ld-context-demo.vercel.app/

**LaunchDarkly project:** `context-management-demo` (environment: **Test**). The live demo uses the US instance; a copy of the project also exists on the EU instance (`app.eu.launchdarkly.com`) for local testing — see [Running against the EU instance](#running-against-the-eu-instance).

For technical details (SDK config, file map, context shapes), see [APP_ARCHITECTURE.md](./APP_ARCHITECTURE.md).

## What this demo shows

The app simulates a signed-in product experience where LaunchDarkly evaluates flags against a rich user context — not just a user ID. It is designed for recordings, workshops, and internal demos rather than local development by third parties.

### Context management

- **Anonymous browsing** — visitors get a persistent anonymous context (UUID stored in session storage).
- **Login** — any username/password creates a multi-context: logged-in user + the same anonymous context.
- **Logout** — returns to anonymous-only context while keeping the anonymous key.
- **Regenerate anonymous context** — generates a new anonymous UUID without signing out.

Context attributes drive targeting:

- `customerStatus` — `"gold"` for username **Michal**, `"bronze"` for everyone else
- `email` — synthetic `{username}@example.com`, marked as a **private attribute** (not sent in LD events)

The current context is displayed as formatted JSON on the page.

### Feature flags in the UI

Several flags control visible behavior:

- **Promotional banners** — top-of-page offers driven by `release-shiny-banner` and `show-newsletter-signup`
- **Button styling** — anonymous-context button color from `create-user-button-colour`
- **Header accent** — small icon beside the logo from `app-logo` (`moon`, `star`, or `rocket`)

A **Feature Flags** table lists every flag in the project with its current value and **evaluation reason** (rule match, fallthrough, etc.).

### Observability

The app includes LaunchDarkly **Observability** and **Session Replay** plugins so sessions, errors, and interactions can be viewed in the LaunchDarkly Observability UI after visiting the live demo.

### Developer toolbar

The LaunchDarkly developer toolbar provides flag overrides and event interception. It is enabled in both local development and production deploys so the live demo can use it.

### Running against the EU instance

The app defaults to the US instance (`app.launchdarkly.com`), which is what the live demo uses. A copy of `context-management-demo` also exists on the EU instance (`app.eu.launchdarkly.com`), and the app can be pointed at it locally:

1. Create a gitignored `.env.eu.local` with `REACT_APP_LD_INSTANCE=eu` and the EU Test environment's client-side ID as `REACT_APP_LD_CLIENT_ID`.
2. Run `npm run dev:eu`.

In EU mode the SDK and observability plugin use the EU endpoints (see `src/ld/instance.js`), and session replay is turned off because the EU instance does not support it.

**The developer toolbar does not work in EU mode.** It renders, but its login always goes through the US-only `integrations.launchdarkly.com` (there is no EU equivalent), and every toolbar feature - flag list, overrides, event view - sits behind that login. Users of an EU-only account therefore cannot use it. Setting `baseUrl` to the EU app only changes deep links. `REACT_APP_LD_TOOLBAR_AUTH_URL` lets you point the toolbar at a different auth host if one becomes available.

## Code references

Flag usages in this repo are synced to LaunchDarkly via a GitHub Action on every push to `main`. See [APP_ARCHITECTURE.md](./APP_ARCHITECTURE.md#code-references-setup) for manual verification steps if code references are not appearing in the LD UI.

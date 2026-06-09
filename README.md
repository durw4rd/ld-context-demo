# LaunchDarkly Context Demo

A live demo app for showing how LaunchDarkly **contexts** and **feature flags** work together.

**Live demo:** https://ld-context-demo.vercel.app/

**LaunchDarkly project:** `context-management-demo` (environment: **Test**)

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

When running locally in development mode, the LaunchDarkly developer toolbar provides flag overrides and event interception. It is disabled in production builds.

## Code references

Flag usages in this repo are synced to LaunchDarkly via a GitHub Action on every push to `main`. See [APP_ARCHITECTURE.md](./APP_ARCHITECTURE.md#code-references-setup) for manual verification steps if code references are not appearing in the LD UI.

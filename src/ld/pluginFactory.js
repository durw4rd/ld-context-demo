import { basicLogger } from '@launchdarkly/js-client-sdk';
import Observability from '@launchdarkly/observability';
import SessionReplay from '@launchdarkly/session-replay';
import { eventInterceptionPlugin, flagOverridePlugin } from './toolbarPlugins';

// Observability (error monitoring/logging/tracing) is always included and never
// manualStart'd - error tracking must stay active regardless of cookie consent.
// Only its `productAnalytics` sub-feature (clicks/pageviews/track events) is
// consent-gated. Session Replay is always constructed with `manualStart: true` so
// recording only begins when we explicitly call LDRecord.start() after consent.
export function buildPlugins({ productAnalytics }) {
  return [
    flagOverridePlugin,
    eventInterceptionPlugin,
    new Observability({
      networkRecording: { enabled: true },
      version: '1.0',
      productAnalytics,
    }),
    new SessionReplay({
      serviceName: 'ld-context-demo',
      privacySetting: 'strict',
      manualStart: true,
    }),
  ];
}

// `sendEvents` gates all analytics/experimentation/guarded-release events sent to
// LaunchDarkly's Events API. `diagnosticOptOut` additionally silences the SDK's own
// non-PII diagnostic "phone home" events when we're not sending events anyway.
export function buildLDOptions({ sendEvents, productAnalytics }) {
  return {
    sendEvents,
    diagnosticOptOut: !sendEvents,
    logger: basicLogger({ level: 'warn' }),
    applicationInfo: {
      id: 'ld-context-demo',
      version: '1.0',
    },
    withReasons: true,
    plugins: buildPlugins({ productAnalytics }),
  };
}

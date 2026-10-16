// Which LaunchDarkly instance the app talks to. US is the default; set
// REACT_APP_LD_INSTANCE=eu (see `.env.eu.local` / `npm run dev:eu`) to point the SDK,
// observability plugin and developer toolbar at the EU-hosted instance instead.
const INSTANCES = {
  us: {
    appUrl: 'https://app.launchdarkly.com',
    sdkEndpoints: {},
    observabilityEndpoints: {},
    sessionReplaySupported: true,
  },
  eu: {
    appUrl: 'https://app.eu.launchdarkly.com',
    sdkEndpoints: {
      baseUri: 'https://clientsdk.eu.launchdarkly.com',
      streamUri: 'https://clientstream.eu.launchdarkly.com',
      eventsUri: 'https://events.eu.launchdarkly.com',
    },
    observabilityEndpoints: {
      backendUrl: 'https://pub.observability.app.eu.launchdarkly.com',
      otel: { otlpEndpoint: 'https://otel.observability.app.eu.launchdarkly.com' },
    },
    // Session replay is not available on the EU instance.
    sessionReplaySupported: false,
  },
};

const instanceKey = (process.env.REACT_APP_LD_INSTANCE || 'us').toLowerCase();

export const ldInstance = {
  key: instanceKey,
  ...(INSTANCES[instanceKey] ?? INSTANCES.us),
  // Optional override for the toolbar's auth iframe host (defaults to
  // https://integrations.launchdarkly.com inside the toolbar, which is US-only).
  toolbarAuthUrl: process.env.REACT_APP_LD_TOOLBAR_AUTH_URL || undefined,
};

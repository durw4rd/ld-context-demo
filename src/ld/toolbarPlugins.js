import { FlagOverridePlugin, EventInterceptionPlugin } from '@launchdarkly/toolbar/plugins';

// Singletons so the same plugin instances are used both when building the LD
// client's plugins array and when wiring up useLaunchDarklyToolbar() in App.jsx.
export const flagOverridePlugin = new FlagOverridePlugin();
export const eventInterceptionPlugin = new EventInterceptionPlugin();

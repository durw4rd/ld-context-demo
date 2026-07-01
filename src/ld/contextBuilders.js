import { faker } from '@faker-js/faker';
import { getJSON, removeItem, setJSON } from '../utils/storage';

// Legacy (flag-off) anonymous key - unchanged from the original app, kept in
// sessionStorage so the "flag off" path is byte-for-byte the pre-existing behavior.
const LEGACY_SESSION_KEY = 'ld_anonymous_user_key';

// Analytics-consent anonymous key - persists in localStorage across reloads AND
// across browser sessions, until the user clicks "Generate new anonymous context"
// or revokes analytics consent.
const PERSISTED_ANON_KEY = 'ld_anon_context_key';

export function generateAnonymousKey() {
  return faker.string.uuid();
}

function getOrCreateLegacyAnonymousKey() {
  let key = sessionStorage.getItem(LEGACY_SESSION_KEY);
  if (!key) {
    key = generateAnonymousKey();
    sessionStorage.setItem(LEGACY_SESSION_KEY, key);
  }
  return key;
}

function getOrCreatePersistedAnonymousKey() {
  let key = getJSON(PERSISTED_ANON_KEY, null);
  if (!key) {
    key = generateAnonymousKey();
    setJSON(PERSISTED_ANON_KEY, key);
  }
  return key;
}

export function regeneratePersistedAnonymousKey() {
  const key = generateAnonymousKey();
  setJSON(PERSISTED_ANON_KEY, key);
  return key;
}

function regenerateLegacyAnonymousKey() {
  const key = generateAnonymousKey();
  sessionStorage.setItem(LEGACY_SESSION_KEY, key);
  return key;
}

// Used by the "Generate New Anonymous User Context" button. Meaningful for 'legacy'
// (today's sessionStorage-backed behavior) and 'analytics' (localStorage-persisted)
// modes, where the key otherwise stays stable. Not offered for 'essential' mode,
// since that key is already regenerated on every page load automatically.
export function regenerateAnonymousKeyForMode(mode) {
  if (mode === 'legacy') return regenerateLegacyAnonymousKey();
  if (mode === 'analytics') return regeneratePersistedAnonymousKey();
  return generateAnonymousKey();
}

export function clearPersistedAnonymousKey() {
  removeItem(PERSISTED_ANON_KEY);
}

// Resolves the anonymous key according to the storage rule for a given mode:
// - legacy: sessionStorage (today's behavior)
// - analytics: localStorage, persisted across reloads/sessions
// - essential: freshly generated, kept only in memory (never written to storage)
export function resolveAnonymousKeyForMode(mode) {
  if (mode === 'legacy') return getOrCreateLegacyAnonymousKey();
  if (mode === 'analytics') return getOrCreatePersistedAnonymousKey();
  return generateAnonymousKey();
}

const customerStatusFor = (username) => (username === 'Michal' ? 'gold' : 'bronze');

// Builds the LD context for the given mode/username/anonymous key. `uaInfo`
// (browser/OS/device attributes) is only merged in for the 'analytics' mode.
// Full user PII (email/customerStatus) is only included for 'legacy' and
// 'analytics' modes - 'essential' strips it down to key/name only.
export function buildContext({ mode, username, anonymousKey, uaInfo }) {
  const anonymousUser = {
    key: anonymousKey,
    anonymous: true,
    ...(mode === 'analytics' && uaInfo ? uaInfo : {}),
  };

  if (!username) {
    return { kind: 'anonymousUser', ...anonymousUser };
  }

  const includeFullPII = mode !== 'essential';
  const user = includeFullPII
    ? {
        key: username,
        name: username,
        email: `${username.toLowerCase()}@example.com`,
        customerStatus: customerStatusFor(username),
        _meta: { privateAttributes: ['email'] },
      }
    : {
        key: username,
        name: username,
      };

  return {
    kind: 'multi',
    user,
    anonymousUser,
  };
}

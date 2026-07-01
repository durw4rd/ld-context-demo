import { useCallback, useState } from 'react';
import { getJSON, removeItem, setJSON } from '../utils/storage';

export const COOKIE_CONSENT_STORAGE_KEY = 'ld_cookie_consent';

// The consent record itself is treated as "strictly necessary" storage - remembering
// that a choice was made (and what it was) is what every cookie-consent tool persists
// regardless of the choice, so it survives reloads/sessions no matter what.
export function useConsent() {
  const [consent, setConsentState] = useState(() => getJSON(COOKIE_CONSENT_STORAGE_KEY, null));

  const setConsent = useCallback((level) => {
    const record = { level, timestamp: new Date().toISOString() };
    setJSON(COOKIE_CONSENT_STORAGE_KEY, record);
    setConsentState(record);
  }, []);

  const resetConsent = useCallback(() => {
    removeItem(COOKIE_CONSENT_STORAGE_KEY);
    setConsentState(null);
  }, []);

  return {
    consent,
    level: consent?.level ?? null,
    setConsent,
    resetConsent,
  };
}

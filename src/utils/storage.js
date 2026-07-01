// Small localStorage wrapper used by the cookie-consent feature. Guards against
// private-browsing / quota errors so a blocked storage API never crashes the app.

const isStorageAvailable = () => {
  try {
    const testKey = '__ld_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

export function getJSON(key, fallback = null) {
  if (!isStorageAvailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function setJSON(key, value) {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore - quota exceeded or storage blocked
  }
}

export function removeItem(key) {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

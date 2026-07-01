import { useState } from 'react';
import PropTypes from 'prop-types';
import { FaLock, FaShieldAlt, FaTimes } from 'react-icons/fa';

function CookiePreferencesModal({ initialAnalyticsEnabled, onSave, onClose }) {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(Boolean(initialAnalyticsEnabled));

  return (
    <div className="cookie-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="cookie-modal animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-label="Cookie preferences"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cookie-modal-header">
          <h3 className="cookie-modal-title">Cookie Preferences</h3>
          <button type="button" className="cookie-modal-close" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <p className="cookie-modal-intro">
          Choose which categories of cookies this demo may use. You can change this at any time from the
          &ldquo;Cookie Preferences&rdquo; link.
        </p>

        <div className="cookie-category">
          <div className="cookie-category-header">
            <span className="cookie-category-name">
              <FaLock /> Strictly Necessary
            </span>
            <span className="cookie-toggle cookie-toggle-locked" aria-disabled="true" title="Always active">
              <span className="cookie-toggle-thumb" />
            </span>
          </div>
          <p className="cookie-category-desc">
            Required for the app to function: remembers your consent choice and keeps you signed in. An
            anonymous, ephemeral LaunchDarkly context (no persistence, no PII) is always used to evaluate
            feature flags. Cannot be disabled.
          </p>
        </div>

        <div className="cookie-category">
          <div className="cookie-category-header">
            <span className="cookie-category-name">
              <FaShieldAlt /> Analytics &amp; Performance
            </span>
            <button
              type="button"
              className={`cookie-toggle ${analyticsEnabled ? 'cookie-toggle-on' : ''}`}
              role="switch"
              aria-checked={analyticsEnabled}
              onClick={() => setAnalyticsEnabled((v) => !v)}
            >
              <span className="cookie-toggle-thumb" />
            </button>
          </div>
          <p className="cookie-category-desc">
            Lets LaunchDarkly detect your browser/OS from your user agent, remember an anonymous ID across
            visits (in local storage), record session replays, and send analytics events used for
            experimentation and guarded releases.
          </p>
        </div>

        <div className="cookie-modal-actions">
          <button type="button" className="btn-outline w-full" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary w-full" onClick={() => onSave(analyticsEnabled)}>
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

CookiePreferencesModal.propTypes = {
  initialAnalyticsEnabled: PropTypes.bool,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CookiePreferencesModal;

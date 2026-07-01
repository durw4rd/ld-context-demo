import PropTypes from 'prop-types';
import { FaCookieBite } from 'react-icons/fa';

function CookieConsentBanner({ onEssentialOnly, onAcceptAll, onManagePreferences }) {
  return (
    <div className="cookie-banner animate-slide-up" role="dialog" aria-label="Cookie consent" aria-live="polite">
      <div className="cookie-banner-inner">
        <div className="cookie-banner-copy">
          <span className="cookie-banner-icon">
            <FaCookieBite />
          </span>
          <div>
            <p className="cookie-banner-title">We value your privacy</p>
            <p className="cookie-banner-text">
              We use cookies to run this demo and, if you let us, to enrich the LaunchDarkly context with
              anonymous device/browser details, remember you across visits, and record session replays for
              product analytics. Essential cookies are always on so the app keeps working. Choose an option
              below, or{' '}
              <button type="button" className="cookie-banner-link" onClick={onManagePreferences}>
                manage preferences
              </button>{' '}
              for granular control.
            </p>
          </div>
        </div>
        <div className="cookie-banner-actions">
          <button type="button" className="btn-outline cookie-banner-btn" onClick={onEssentialOnly}>
            Essential Only
          </button>
          <button type="button" className="btn-primary cookie-banner-btn" onClick={onAcceptAll}>
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}

CookieConsentBanner.propTypes = {
  onEssentialOnly: PropTypes.func.isRequired,
  onAcceptAll: PropTypes.func.isRequired,
  onManagePreferences: PropTypes.func.isRequired,
};

export default CookieConsentBanner;

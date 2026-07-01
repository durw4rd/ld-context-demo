import PropTypes from 'prop-types';
import { FaCookieBite } from 'react-icons/fa';

function CookiePreferencesLink({ onClick }) {
  return (
    <button type="button" className="cookie-preferences-link" onClick={onClick} title="Change your cookie consent">
      <FaCookieBite />
      Cookie Preferences
    </button>
  );
}

CookiePreferencesLink.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default CookiePreferencesLink;

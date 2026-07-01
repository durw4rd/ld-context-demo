import { useState, useEffect, useCallback } from 'react'
import './App.css'
import {
  useBoolVariation,
  useStringVariation,
  useInitializationStatus,
  useLDClient,
} from '@launchdarkly/react-sdk';
import { useLaunchDarklyToolbar } from '@launchdarkly/toolbar/react';
import { LDRecord } from '@launchdarkly/session-replay';
import Cookies from 'js-cookie';
import { FaEnvelope, FaUser, FaLock, FaSignOutAlt, FaRocket, FaCode, FaMoon, FaStar } from 'react-icons/fa'
import AllFlagsDisplay from './components/AllFlagsDisplay'
import CookieConsentBanner from './components/CookieConsentBanner'
import CookiePreferencesModal from './components/CookiePreferencesModal'
import CookiePreferencesLink from './components/CookiePreferencesLink'
import { flagOverridePlugin, eventInterceptionPlugin } from './ld/toolbarPlugins'
import { useLDReinit, useLDActiveMode } from './ld/ldReinitContext'
import {
  buildContext,
  resolveAnonymousKeyForMode,
  regenerateAnonymousKeyForMode,
  clearPersistedAnonymousKey,
} from './ld/contextBuilders'
import { buildLDOptions } from './ld/pluginFactory'
import { getUAInfo } from './utils/uaParser'
import { useConsent } from './hooks/useConsent'

function App() {
  const { status: initStatus, error: initError } = useInitializationStatus();

  if (initStatus === 'initializing') {
    return (
      <div className="app-shell flex items-center justify-center min-h-screen">
        <p className="text-[var(--color-text-muted)]">Loading feature flags…</p>
      </div>
    );
  }

  if (initStatus === 'failed') {
    return (
      <div className="app-shell flex items-center justify-center min-h-screen">
        <p className="text-red-400">LaunchDarkly init failed: {initError?.message}</p>
      </div>
    );
  }

  if (initStatus === 'timeout') {
    return (
      <div className="app-shell flex items-center justify-center min-h-screen">
        <p className="text-red-400">LaunchDarkly init timed out</p>
      </div>
    );
  }

  return <AppContent />;
}

function AppContent() {
  const releaseShinyBanner = useBoolVariation('release-shiny-banner', false);
  const showNewsletterSignup = useBoolVariation('show-newsletter-signup', false);
  const createUserButtonColour = useStringVariation('create-user-button-colour', 'cyan');
  const appLogo = useStringVariation('app-logo', 'rocket');
  const enableCookieConsent = useBoolVariation('enable-cookie-consent-banner', false);
  const ldClient = useLDClient();
  const { status: initStatus } = useInitializationStatus();

  const reinit = useLDReinit();
  const activeMode = useLDActiveMode();
  const { level: consentLevel, setConsent, resetConsent } = useConsent();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(Cookies.get('user') || null);
  const [error, setError] = useState('');
  const [ldContext, setLdContext] = useState(null);
  const [anonymousKey, setAnonymousKey] = useState(() => resolveAnonymousKeyForMode(activeMode));
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // The mode implied by the flag + stored consent preference right now. When this
  // differs from `activeMode` (what the mounted client generation was built for),
  // the effect below upgrades/downgrades by reinitializing the LD client.
  const desiredMode = !enableCookieConsent ? 'legacy' : consentLevel === 'analytics' ? 'analytics' : 'essential';

  useLaunchDarklyToolbar({
    flagOverridePlugin,
    eventInterceptionPlugin,
    position: 'bottom-right',
    enabled: import.meta.env.DEV,
  });

  useEffect(() => {
    if (ldClient) {
      setLdContext(ldClient.getContext());
    }
  }, [ldClient]);

  useEffect(() => {
    if (!ldClient) return;

    const handleChange = (_context, changedKeys) => {
      if (!Array.isArray(changedKeys) || changedKeys.length === 0) return;
      console.log('##### Flags changed #####', changedKeys.join(', '));
    };

    ldClient.on('change', handleChange);
    return () => ldClient.off('change', handleChange);
  }, [ldClient]);

  // Rebuilds the context/ldOptions for a target mode and reinitializes the LD
  // client. A full reinit is required (rather than just `identify()`) because
  // `sendEvents` and Observability's `productAnalytics` are construction-time-only
  // options - they can't be toggled on an already-running client.
  const applyMode = useCallback(
    (mode) => {
      if (mode !== 'analytics') {
        clearPersistedAnonymousKey();
      }
      const newAnonymousKey = resolveAnonymousKeyForMode(mode);
      const uaInfo = mode === 'analytics' ? getUAInfo() : undefined;
      const context = buildContext({ mode, username: user, anonymousKey: newAnonymousKey, uaInfo });
      const ldOptions = buildLDOptions({
        sendEvents: mode !== 'essential',
        productAnalytics: mode !== 'essential',
      });
      reinit(mode, context, ldOptions);
    },
    [user, reinit],
  );

  // Cold boot (stored 'analytics' consent from a prior session, or the flag being
  // off) as well as banner/preferences interactions all funnel through here.
  useEffect(() => {
    if (desiredMode === activeMode) return;
    applyMode(desiredMode);
  }, [desiredMode, activeMode, applyMode]);

  // Start/stop session replay once the *current* client generation is ready.
  // Observability's error tracking is unaffected by this - it's always on.
  useEffect(() => {
    if (initStatus !== 'complete') return;
    if (activeMode === 'essential') {
      LDRecord.stop();
    } else {
      LDRecord.start().catch(() => {});
    }
  }, [initStatus, activeMode]);

  const generateNewAnonymousUserContext = async () => {
    if (!ldClient || activeMode === 'essential') return;

    const newAnonymousKey = regenerateAnonymousKeyForMode(activeMode);
    setAnonymousKey(newAnonymousKey);
    const uaInfo = activeMode === 'analytics' ? getUAInfo() : undefined;
    const context = buildContext({ mode: activeMode, username: user, anonymousKey: newAnonymousKey, uaInfo });

    try {
      await ldClient.identify(context);
      setLdContext(ldClient.getContext());
    } catch (error) {
      console.error('Failed to identify new anonymous user context:', error);
      setLdContext(context);
    }
  };

  const handleLogin = async () => {
    if (username && password) {
      Cookies.set('user', username, { expires: 1 });
      setUser(username);
      setError('');

      if (ldClient) {
        const uaInfo = activeMode === 'analytics' ? getUAInfo() : undefined;
        const context = buildContext({ mode: activeMode, username, anonymousKey, uaInfo });

        try {
          await ldClient.identify(context);
          setLdContext(ldClient.getContext());
        } catch (error) {
          console.error('Failed to identify user context:', error);
          setLdContext(context);
        }
      }
    } else {
      setError('Please enter both username and password.');
    }
  };

  const handleLogout = async () => {
    Cookies.remove('user');
    setUser(null);

    if (ldClient) {
      const uaInfo = activeMode === 'analytics' ? getUAInfo() : undefined;
      const context = buildContext({ mode: activeMode, username: null, anonymousKey, uaInfo });

      try {
        await ldClient.identify(context);
        setLdContext(ldClient.getContext());
      } catch (error) {
        console.error('Failed to identify anonymous user context:', error);
        setLdContext(context);
      }
    }
  };

  const handleEssentialOnly = () => {
    setConsent('essential');
    setPreferencesOpen(false);
  };

  const handleAcceptAll = () => {
    setConsent('analytics');
    setPreferencesOpen(false);
  };

  const handleSavePreferences = (analyticsEnabled) => {
    setConsent(analyticsEnabled ? 'analytics' : 'essential');
    setPreferencesOpen(false);
  };

  const handleResetConsent = () => {
    resetConsent();
  };

  const formatContext = (context) => {
    const jsonString = JSON.stringify(context, null, 2);
    return jsonString
      .replace(/"kind": "(\w+)"/g, '"kind": "<span class="context-kind">$1</span>"')
      .replace(/"(\w+)": {/g, '"<span class="context-attribute">$1</span>": {');
  };

  const getLogoIcon = () => {
    switch (appLogo) {
      case 'moon':
        return <FaMoon />;
      case 'star':
        return <FaStar />;
      case 'rocket':
      default:
        return <FaRocket />;
    }
  };

  const getCustomerStatusBadge = () => {
    const status = ldContext?.user?.customerStatus;
    if (!status) return null;

    const isGold = status === 'gold';
    return (
      <span className={`badge ${isGold ? 'badge-gold' : 'badge-bronze'}`}>
        {status}
      </span>
    );
  };

  const getConsentStatusLabel = () => {
    if (activeMode === 'legacy') return 'Flag Off · Legacy Behavior';
    if (activeMode === 'analytics') return 'Consent: Accept All';
    return 'Consent: Essential Only';
  };

  const loginComponent = () => (
    <div className="animate-fade-in">
      <p className="section-label">Sign in</p>
      <div className="auth-form-group">
        <div className="auth-input-wrap">
          <FaUser className="auth-input-icon" />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>
        <div className="auth-input-wrap">
          <FaLock className="auth-input-icon" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>
        <button onClick={handleLogin} className="btn-primary w-full">
          Sign In
        </button>
        {error && (
          <div className="auth-error">
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );

  const accountOverviewComponent = () => (
    <div className="animate-fade-in">
      <div className="auth-user-header">
        <div className="auth-avatar auth-avatar-lg">
          {user.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="auth-user-name">{user}</h2>
          {getCustomerStatusBadge()}
        </div>
      </div>
      <p className="section-label">Profile</p>
      <div className="profile-info">
        <div className="profile-info-item">
          <span className="profile-info-label">Name</span>
          <span className="profile-info-value">{user}</span>
        </div>
        <div className="profile-info-item">
          <span className="profile-info-label">Email</span>
          <span className="profile-info-value">
            {activeMode === 'essential' ? 'hidden (essential-only consent)' : `${user.toLowerCase()}@example.com`}
          </span>
        </div>
        <div className="profile-info-item">
          <span className="profile-info-label">Status</span>
          <span className="profile-info-value">{getCustomerStatusBadge() || '—'}</span>
        </div>
      </div>
      <div className="context-actions">
        <button onClick={handleLogout} className="btn-danger w-full flex items-center justify-center gap-2">
          <FaSignOutAlt /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      {releaseShinyBanner && (
        <div className="fixed top-0 left-0 right-0 promo-banner promo-banner-shiny px-6 py-3 text-center z-50 animate-slide-down text-sm">
          Exclusive offer for Bronze customers — limited time only
        </div>
      )}
      {showNewsletterSignup && (
        <button className={`fixed ${releaseShinyBanner ? 'top-[52px]' : 'top-0'} left-0 right-0 promo-banner promo-banner-newsletter px-6 py-3 flex items-center justify-center gap-2 z-50 animate-slide-down rounded-none border-0 text-sm`}>
          <FaEnvelope />
          Sign up for our newsletter — available to 50% of traffic
        </button>
      )}

      <header className={`app-topbar${releaseShinyBanner && showNewsletterSignup ? ' mt-[104px]' : releaseShinyBanner || showNewsletterSignup ? ' mt-[52px]' : ''}`}>
        <div className="app-topbar-brand">
          <img
            src="/LaunchDarkly_RGB_Primary_Lock-up_White.svg"
            alt="LaunchDarkly"
            className="app-logo-lockup"
          />
          <div className="app-topbar-text">
            <p className="app-topbar-title">Context Management Demo</p>
            <p className="app-topbar-subtitle">Feature flags with real-time context evaluation</p>
          </div>
        </div>
        <div className="app-topbar-meta">
          <span
            className={`consent-status-badge consent-status-${activeMode}`}
            title="Current cookie-consent mode driving the LD context/events/plugins"
          >
            {getConsentStatusLabel()}
          </span>
          <span className="app-logo-badge" title={`app-logo flag: ${appLogo ?? 'rocket'}`}>
            <span className="app-logo-badge-icon">{getLogoIcon()}</span>
            app-logo: {appLogo ?? 'rocket'}
          </span>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-grid">
          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <h2 className="dashboard-panel-title">
                <FaUser />
                {user ? 'Session' : 'Authentication'}
              </h2>
            </div>
            <div className="dashboard-panel-body">
              {user ? accountOverviewComponent() : loginComponent()}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <h2 className="dashboard-panel-title">
                <FaCode />
                Current Context
              </h2>
            </div>
            <div className="dashboard-panel-body">
              <pre className="context-display" dangerouslySetInnerHTML={{ __html: formatContext(ldContext) }} />
              <div className="context-actions">
                <button
                  onClick={generateNewAnonymousUserContext}
                  disabled={activeMode === 'essential'}
                  title={
                    activeMode === 'essential'
                      ? 'Not needed under Essential Only consent - the anonymous key already regenerates on every reload'
                      : 'Generates a new anonymous key and persists it'
                  }
                  className={`w-full flex items-center justify-center gap-2 ${createUserButtonColour === 'magenta' ? 'btn-danger' : 'btn-success'}`}
                >
                  <FaUser />
                  Generate New Anonymous User Context
                </button>
              </div>
            </div>
          </section>
        </div>

        <section className="dashboard-panel">
          <AllFlagsDisplay />
        </section>
      </main>

      {enableCookieConsent && !consentLevel && !preferencesOpen && (
        <CookieConsentBanner
          onEssentialOnly={handleEssentialOnly}
          onAcceptAll={handleAcceptAll}
          onManagePreferences={() => setPreferencesOpen(true)}
        />
      )}

      {enableCookieConsent && consentLevel && (
        <CookiePreferencesLink onClick={handleResetConsent} />
      )}

      {enableCookieConsent && preferencesOpen && (
        <CookiePreferencesModal
          initialAnalyticsEnabled={consentLevel === 'analytics'}
          onSave={handleSavePreferences}
          onClose={() => setPreferencesOpen(false)}
        />
      )}
    </div>
  )
}

export default App

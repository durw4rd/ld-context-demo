import { useState, useEffect } from 'react'
import './App.css'
import { useFlags, useLDClient } from 'launchdarkly-react-client-sdk';
import { useLaunchDarklyToolbar } from '@launchdarkly/toolbar';
import Cookies from 'js-cookie';
import { faker } from '@faker-js/faker'
import { FaEnvelope, FaUser, FaLock, FaSignOutAlt, FaRocket, FaCode, FaMoon, FaStar } from 'react-icons/fa'
import AllFlagsDisplay from './components/AllFlagsDisplay'
import { flagOverridePlugin, eventInterceptionPlugin } from './main.jsx';

function App() {
  const { releaseShinyBanner, showNewsletterSignup, createUserButtonColour, appLogo } = useFlags();
  const ldClient = useLDClient();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(Cookies.get('user') || null);
  const [error, setError] = useState('');
  const [ldContext, setLdContext] = useState(null);

  // Initialize LaunchDarkly developer toolbar (development only)
  useLaunchDarklyToolbar({
    flagOverridePlugin,
    eventInterceptionPlugin,
    position: 'bottom-right',
    enabled: import.meta.env.DEV
  });

  useEffect(() => {
    if (ldClient) {
      setLdContext(ldClient.getContext());
    }
  }, []);

  useEffect(() => {
    if (ldClient) {
      const handleChange = (changes) => {
        console.log('##### Flags changed START #####');
        for (let flagKey in changes) {
          const flagValue = changes[flagKey].current;
          console.log(`${flagKey}: ${flagValue}`);
        }
        console.log('##### Flags changed STOP #####');
      };
  
      ldClient.on('change', handleChange);
  
      // Cleanup function to remove the event listener when the component unmounts
      return () => {
        ldClient.off('change', handleChange);
      };
    }
  }, [ldClient]);

  function capitalizeFirstLetter(string) {
    if (!string) return string;
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  const generateNewAnonymousUserContext = async () => {
    if (!ldClient) return;
    
    const existingContext = ldClient.getContext();
    const newAnonymousKey = faker.string.uuid();
    
    // Save the new anonymous key to sessionStorage
    sessionStorage.setItem('ld_anonymous_user_key', newAnonymousKey);
    
    try {
      if (existingContext.kind === 'multi') {
        const newAnonymousUserContext = {
          key: newAnonymousKey,
          anonymous: true,
        };
        const updatedContext = {
          kind: 'multi',
          anonymousUser: newAnonymousUserContext,
          user: existingContext.user
        };

        await ldClient.identify(updatedContext);
        setLdContext(updatedContext);
        return;
      } else if (existingContext.kind === 'anonymousUser') {
        const newAnonymousUserContext = {
          kind: 'anonymousUser',
          key: newAnonymousKey,
          anonymous: true,
        };

        await ldClient.identify(newAnonymousUserContext);
        setLdContext(newAnonymousUserContext);
      }
    } catch (error) {
      // Handle network errors gracefully
      console.error('Failed to identify new anonymous user context:', error);
      // Still update the local context even if the network call fails
      // This allows the UI to update even when offline
      if (existingContext.kind === 'multi') {
        const updatedContext = {
          kind: 'multi',
          anonymousUser: {
            key: newAnonymousKey,
            anonymous: true,
          },
          user: existingContext.user
        };
        setLdContext(updatedContext);
      } else if (existingContext.kind === 'anonymousUser') {
        setLdContext({
          kind: 'anonymousUser',
          key: newAnonymousKey,
          anonymous: true,
        });
      }
    }
  };

  const handleLogin = async () => {
    if (username && password) {
      Cookies.set('user', username, { expires: 1 });
      setUser(username);
      setError('');

      if (ldClient) {
        const existingContext = ldClient.getContext();
        let newUserContext = {}
        if (username === 'Michal') {
          newUserContext = {
            key: username,
            name: username,
            email: `${username.toLowerCase()}@example.com`,
            customerStatus: 'gold',
            _meta: {
              privateAttributes: ['email']
            }
          };
        } else {
          newUserContext = {
            key: username,
            name: username,
            email: `${username.toLowerCase()}@example.com`,
            customerStatus: 'bronze',
            _meta: {
              privateAttributes: ['email']
            }
          };
        }

        // Get the anonymous user key from sessionStorage or use the existing one
        const anonymousKey = sessionStorage.getItem('ld_anonymous_user_key') || 
                            (existingContext.anonymousUser?.key || existingContext.key);

        const updatedContext = {
          kind: 'multi',
          anonymousUser: {
            key: anonymousKey,
            anonymous: true
          },
          user: newUserContext
        };

        try {
          await ldClient.identify(updatedContext);
          setLdContext(ldClient.getContext());
        } catch (error) {
          // Handle network errors gracefully
          console.error('Failed to identify user context:', error);
          // Still update the local context even if the network call fails
          setLdContext(updatedContext);
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
      const existingContext = ldClient.getContext();
      // Get the anonymous user key from sessionStorage or use the existing one
      const anonymousKey = sessionStorage.getItem('ld_anonymous_user_key') || (existingContext.anonymousUser?.key || existingContext.key);
  
      const updatedContext = {
        kind: 'anonymousUser',
        key: anonymousKey,
        anonymous: true
      };
  
      try {
        await ldClient.identify(updatedContext);
        setLdContext(ldClient.getContext());
      } catch (error) {
        // Handle network errors gracefully
        console.error('Failed to identify anonymous user context:', error);
        // Still update the local context even if the network call fails
        setLdContext(updatedContext);
      }
    }
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

  const loginComponent = () => (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <div className="auth-card w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] mb-4">
            <FaUser className="text-2xl text-[var(--color-bg-primary)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Welcome Back</h2>
          <p className="text-[var(--color-text-muted)] mt-1">Sign in to your account</p>
        </div>
        
        <div className="space-y-4">
          <div className="relative">
            <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full !pl-12"
            />
          </div>
          <div className="relative">
            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full !pl-12"
            />
          </div>
          
          <button
            onClick={handleLogin}
            className="btn-primary w-full py-3 text-base"
          >
            Sign In
          </button>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const accountOverviewComponent = () => {
    return (
      <div className="flex flex-col items-center justify-center animate-fade-in">
        <div className="auth-card w-full max-w-lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] flex items-center justify-center text-xl font-bold text-[var(--color-bg-primary)]">
              {user.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">{user}</h2>
              <div className="flex items-center gap-2 mt-1">
                {getCustomerStatusBadge()}
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="section-title">Profile Information</h3>
            <div className="profile-info">
              <div className="profile-info-item">
                <span className="profile-info-label">Name</span>
                <span className="profile-info-value">{user}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Email</span>
                <span className="profile-info-value">{user.toLowerCase()}@example.com</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Status</span>
                <span className="profile-info-value">
                  {getCustomerStatusBadge()}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="section-title">Actions</h3>
            <div className="grid gap-3">
              <button
                onClick={handleLogout}
                className="btn-danger w-full flex items-center justify-center gap-2"
              >
                <FaSignOutAlt /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Promotional Banners */}
      { releaseShinyBanner && (
        <div className="fixed top-0 left-0 right-0 promo-banner promo-banner-shiny p-4 text-center z-50 animate-slide-down">
          <span className="font-medium">🌟 Exclusive offer for Bronze customers! Limited time only 🌟</span>
        </div>
      )}
      { showNewsletterSignup && (
        <button className={`fixed ${releaseShinyBanner ? 'top-[52px]' : 'top-0'} left-0 right-0 promo-banner promo-banner-newsletter p-4 flex items-center justify-center gap-2 z-50 animate-slide-down rounded-none border-0`}>
          <FaEnvelope />
          <span className="font-medium">Sign up for our newsletter - available to 50% of our traffic!</span>
        </button>
      )}
      
      {/* Header */}
      <header className={`app-header ${releaseShinyBanner && showNewsletterSignup ? 'pt-32' : releaseShinyBanner || showNewsletterSignup ? 'pt-20' : 'pt-8'}`}>
        <div className="app-logo">
          <div className="app-logo-icon">
            {getLogoIcon()}
          </div>
          <h1>LD Context Demo</h1>
        </div>
        <p className="app-subtitle">Feature flag management with LaunchDarkly</p>
      </header>
      
      {/* Main Content */}
      <main className="space-y-8">
        {/* Auth Section */}
        <section>
          { user ? accountOverviewComponent() : loginComponent()}
        </section>
        
        {/* Context Display */}
        <section className="flex flex-col items-center">
          <div className="w-full max-w-lg">
            <h3 className="section-title mb-4">
              <FaCode className="text-[var(--color-accent-primary)]" />
              Current Context
            </h3>
            <pre className="context-display" dangerouslySetInnerHTML={{ __html: formatContext(ldContext) }} />
            
            <button 
              onClick={generateNewAnonymousUserContext} 
              className={`w-full mt-4 py-3 text-base flex items-center justify-center gap-2 ${createUserButtonColour === 'red' ? 'btn-danger' : 'btn-success'}`}
            >
              <FaUser />
              Generate New Anonymous User Context
            </button>
          </div>
        </section>
        
        {/* Feature Flags Display */}
        <section className="flex flex-col items-center">
          <AllFlagsDisplay />
        </section>
      </main>
    </div>
  )
}

export default App

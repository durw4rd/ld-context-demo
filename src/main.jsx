import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { createLDReactProvider } from '@launchdarkly/react-sdk'
import { basicLogger } from '@launchdarkly/js-client-sdk'
import { FlagOverridePlugin, EventInterceptionPlugin } from '@launchdarkly/toolbar/plugins'
import Observability from '@launchdarkly/observability'
import SessionReplay from '@launchdarkly/session-replay'

import { faker } from '@faker-js/faker'
import Cookies from 'js-cookie';

const ldClientSideID = process.env.REACT_APP_LD_CLIENT_ID;

export const flagOverridePlugin = new FlagOverridePlugin();
export const eventInterceptionPlugin = new EventInterceptionPlugin();

// Helper function to get or create anonymous user key from sessionStorage
const getOrCreateAnonymousUserKey = () => {
  const storageKey = 'ld_anonymous_user_key';
  let anonymousKey = sessionStorage.getItem(storageKey);
  
  if (!anonymousKey) {
    anonymousKey = faker.string.uuid();
    sessionStorage.setItem(storageKey, anonymousKey);
  }
  
  return anonymousKey;
};

const user = Cookies.get('user') || null;
let ldDefaultContext = {};

if (user) {
  const customeStatus = user === 'Michal' ? 'gold' : 'bronze';
  ldDefaultContext = {
    kind: 'multi',
    user: {
      key: user,
      name: user,
      email: `${user.toLowerCase()}@example.com`,
      customerStatus: customeStatus,
      _meta: {
        privateAttributes: ['email']
      }
    },
    anonymousUser: {
      key: getOrCreateAnonymousUserKey(),
      anonymous: true
    }
  };
} else {
  ldDefaultContext = {
    kind: 'anonymousUser',
    key: getOrCreateAnonymousUserKey(),
    anonymous: true
  };
}

const LDProvider = createLDReactProvider(
  ldClientSideID,
  ldDefaultContext,
  {
    ldOptions: {
      sendEvents: true,
      logger: basicLogger({
        level: 'warn',
      }),
      applicationInfo: {
        id: 'ld-context-demo',
        version: '1.0',
      },
      withReasons: true,
      plugins: [
        flagOverridePlugin,
        eventInterceptionPlugin,
        new Observability({
          networkRecording: { enabled: true },
          version: '1.0',
        }),
        new SessionReplay({
          serviceName: 'ld-context-demo',
          privacySetting: 'strict',
        }),
      ],
    },
  },
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LDProvider>
      <App />
    </LDProvider>
  </React.StrictMode>
)

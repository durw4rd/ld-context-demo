import { useCallback, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { createLDReactProvider } from '@launchdarkly/react-sdk';
import { buildContext, resolveAnonymousKeyForMode } from './contextBuilders';
import { buildLDOptions } from './pluginFactory';
import { LDActiveModeContext, LDReinitContext } from './ldReinitContext';

const ldClientSideID = process.env.REACT_APP_LD_CLIENT_ID;

// `sendEvents`/`productAnalytics` can only be set at LD client construction time, so
// every consent-level transition is handled by tearing down and recreating the
// entire client (see `reinitialize` below) rather than mutating it in place. The
// client always boots in the safest ("essential") shape - no PII beyond key/name, no
// persisted anonymous key, sendEvents off, session replay/product analytics off -
// and is only upgraded once the enable-cookie-consent-banner flag value and any
// stored consent preference are known (see App.jsx).
function buildBootstrapConfig() {
  const mode = 'essential';
  const anonymousKey = resolveAnonymousKeyForMode(mode);
  const context = buildContext({ mode, username: null, anonymousKey });
  const ldOptions = buildLDOptions({ sendEvents: false, productAnalytics: false });
  return { mode, context, ldOptions };
}

export default function LDRoot({ children }) {
  const configRef = useRef(buildBootstrapConfig());
  const [generation, setGeneration] = useState(0);

  const Provider = useMemo(
    () =>
      createLDReactProvider(ldClientSideID, configRef.current.context, {
        ldOptions: configRef.current.ldOptions,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [generation],
  );

  const reinitialize = useCallback((mode, context, ldOptions) => {
    configRef.current = { mode, context, ldOptions };
    setGeneration((g) => g + 1);
  }, []);

  return (
    <LDReinitContext.Provider value={reinitialize}>
      <LDActiveModeContext.Provider value={configRef.current.mode}>
        <Provider key={generation}>{children}</Provider>
      </LDActiveModeContext.Provider>
    </LDReinitContext.Provider>
  );
}

LDRoot.propTypes = {
  children: PropTypes.node.isRequired,
};

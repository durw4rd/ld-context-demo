/**
 * One-off diagnostic: verify LD analytics events are generated and accepted.
 * Run: node scripts/debug-events.mjs
 */
import { createClient } from '@launchdarkly/js-client-sdk';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadClientId() {
  const envPath = resolve(process.cwd(), '.env');
  const line = readFileSync(envPath, 'utf8')
    .split('\n')
    .find((l) => l.startsWith('REACT_APP_LD_CLIENT_ID='));
  if (!line) throw new Error('REACT_APP_LD_CLIENT_ID not found in .env');
  return line.split('=')[1].trim().split(/\s+/)[0];
}

const clientSideID = loadClientId();
console.log('Client-side ID:', clientSideID);

const context = {
  kind: 'user',
  key: 'debug-events-script',
  name: 'Debug Script',
  customerStatus: 'bronze',
};

const client = createClient(clientSideID, context, {
  logger: { debug: () => {}, info: () => {}, warn: console.warn, error: console.error },
});

client.start();

const result = await client.waitForInitialization({ timeout: 5 });
if (result.status !== 'complete') {
  console.error('Initialization failed:', result.status, result.error);
  process.exit(1);
}

console.log('\n--- variation calls ---');
for (const key of ['app-logo', 'release-shiny-banner', 'show-newsletter-signup', 'create-user-button-colour']) {
  const value = client.variation(key, null);
  console.log(`  ${key}:`, value);
}

console.log('\n--- flushing events ---');
await client.flush();
console.log('flush complete');

await client.close();
console.log('done');

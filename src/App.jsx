import { useState, useEffect } from 'react'
import './App.css'
import { useFlags, useLDClient } from 'launchdarkly-react-client-sdk';
import Cookies from 'js-cookie';
import { faker } from '@faker-js/faker'

function App() {
  const { releaseShinyBanner, showNewsletterSignup } = useFlags();
  const ldClient = useLDClient();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(Cookies.get('user') || null);
  const [error, setError] = useState('');
  const [ldContext, setLdContext] = useState(null);

  useEffect(() => {
    if (ldClient) {
      setLdContext(ldClient.getContext());
    }
  }, []);

  function capitalizeFirstLetter(string) {
    if (!string) return string;
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  const generateNewAnonymousUserContext = () => {
    const existingContext = ldClient.getContext();
    if (existingContext.kind === 'multi') {
      const newAnonymousUserContext = {
        key: faker.string.uuid(),
        anonymous: true,
      };
      const updatedContext = {
        kind: 'multi',
        anonymousUser: newAnonymousUserContext,
        user: existingContext.user
      };

      ldClient.identify(updatedContext);
      setLdContext(ldClient.getContext());
      return;
    } else if (existingContext.kind === 'anonymousUser') {
      const newAnonymousUserContext = {
        kind: 'anonymousUser',
        key: faker.string.uuid(),
        anonymous: true,
      };

      ldClient.identify(newAnonymousUserContext);
      setLdContext(newAnonymousUserContext);
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
            customerStatus: 'gold'
          };
        } else {
          newUserContext = {
            key: username,
            name: username,
            customerStatus: 'bronze'
          };
        }

        const updatedContext = {
          kind: 'multi',
          anonymousUser: {
            key: existingContext.key,
            anonymous: true
          },
          user: newUserContext
        };

        await ldClient.identify(updatedContext);
        setLdContext(ldClient.getContext());
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
      const anonymousUserContext = existingContext.anonymousUser;
  
      const updatedContext = {
        kind: 'anonymousUser',
        ...anonymousUserContext
      };
  
      await ldClient.identify(updatedContext);
      setLdContext(ldClient.getContext());
    }
  };

  const formatContext = (context) => {
    const jsonString = JSON.stringify(context, null, 2);
    return jsonString
      .replace(/"kind": "(\w+)"/g, '"kind": "<span class="context-kind">$1</span>"')
      .replace(/"(\w+)": {/g, '"<span class="context-attribute">$1</span>": {');
  };

  const loginComponent = () => (
    <div className="flex flex-col items-center justify-center m-4">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4">Login Screen</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-2 p-2 border border-gray-300 rounded w-full"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 p-2 border border-gray-300 rounded w-full"
        />
        <button
          onClick={handleLogin}
          className="bg-blue-500 text-white p-2 rounded w-full"
        >
          Login
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  );

  const accountOverviewComponent = () => {

    return (
      <div className="bg-white p-6 rounded shadow-md w-full max-w-lg">
          <h2 className="text-2xl font-bold mb-4">Account Overview</h2>
          <div className="mb-4">
            <h3 className="text-xl font-semibold">Profile Information</h3>
            <br/>
            <p className="text-gray-700 text-left">Name: {user}</p>
            <p className="text-gray-700 text-left">Email: {user.toLowerCase()}@example.com</p>
            <p className="text-gray-700 text-left">Customer status: {ldContext && ldContext.user && capitalizeFirstLetter(ldContext.user.customerStatus)} customer</p>
          </div>
          <div className="mb-4">
            <h3 className="text-xl font-semibold">Settings</h3>
            <br/>
            <button className="bg-blue-500 text-white p-2 rounded w-full">Change Password</button>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white p-2 rounded w-full mt-2"
            >
              Logout
            </button>
        </div>
      </div>
    )
  };

  return (
    <>
      { releaseShinyBanner && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-200 p-4 rounded text-center border border-yellow-400 z-50">
          🌟 Shiny banner released to 50% of all traffic! 🌟
        </div>
      ) }
      <h1 className="text-center text-4xl font-bold my-8">LD Context Demo</h1>
      { showNewsletterSignup && (
        <button className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-4 rounded w-full mt-2 mb-4 text-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
          Sign up for our newsletter, Gold customer!
        </button>
      )}
      <div>
        { user ? accountOverviewComponent() : loginComponent()}
      </div>
      <div>
        <pre className="context-display" dangerouslySetInnerHTML={{ __html: formatContext(ldContext) }} />
      </div>
      <button 
        onClick={generateNewAnonymousUserContext} 
        className="bg-green-500 text-white p-2 rounded w-full mt-4 mb-4 text-lg shadow-lg transform hover:scale-105 transition-transform duration-300"
      >
        Generate New Anonymous User Context
      </button>
    </>
  )
}

export default App

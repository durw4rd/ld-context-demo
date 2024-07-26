import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCR0DQsU8ivU_4nNvXAek7GuJrQTS32Q_0",
  authDomain: "ld-context-demo.firebaseapp.com",
  projectId: "ld-context-demo",
  storageBucket: "ld-context-demo.appspot.com",
  messagingSenderId: "647431730375",
  appId: "1:647431730375:web:8d69d8721bc46df46abae2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
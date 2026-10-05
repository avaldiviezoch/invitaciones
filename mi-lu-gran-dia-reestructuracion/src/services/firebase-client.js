import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {
  browserLocalPersistence,
  getAuth,
  setPersistence
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app-check.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDCRuQgMjnm7KcAN_qo8AHPD3ueyis4-LY',
  authDomain: 'migrandia.firebaseapp.com',
  projectId: 'migrandia',
  storageBucket: 'migrandia.firebasestorage.app',
  messagingSenderId: '7432985765',
  appId: '1:7432985765:web:b3a4844f41ac2a1376c14c'
};

const app = getApps()[0] || initializeApp(firebaseConfig);

const APP_CHECK_SITE_KEY = '6LeukOAtAAAAAJODsmEu9XyMLnyb6JH9TNYizFHk';
const APP_CHECK_HOSTS = new Set([
  'migrandiapp.com',
  'www.migrandiapp.com',
  'avaldiviezoch.github.io'
]);

const currentHost = String(globalThis.location?.hostname || '').trim().toLowerCase();
const appCheck = APP_CHECK_HOSTS.has(currentHost)
  ? initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    })
  : null;

const auth = getAuth(app);
const db = getFirestore(app);
const authPersistenceReady = setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('No se pudo fijar la persistencia de autenticación:', error);
});

export { appCheck, auth, authPersistenceReady, db };

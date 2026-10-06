import { currentEnvironment, serviceUrl } from './runtime-environment.js';

const APP_VERSION = 'mgd-006-20261006';
const ENDPOINT = serviceUrl('/api/observability');
let installed = false;

function clean(value, max = 500) {
  return String(value ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
}

function errorShape(value) {
  if (value instanceof Error) return { name: clean(value.name, 80), message: clean(value.message), stack: clean(value.stack, 1600) };
  return { name: 'Error', message: clean(value) };
}

function reportError(type, error, extra = {}) {
  const payload = {
    type: clean(type, 80),
    error: errorShape(error),
    context: {
      version: APP_VERSION,
      environment: currentEnvironment().name,
      path: clean(location.pathname + location.hash, 220),
      viewport: innerWidth + 'x' + innerHeight,
      online: navigator.onLine,
      ...extra
    },
    at: new Date().toISOString()
  };
  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(() => {});
}

function installObservability() {
  if (installed) return;
  installed = true;
  addEventListener('error', event => reportError('javascript', event.error || event.message, {
    source: clean(event.filename, 220),
    line: Number(event.lineno || 0),
    column: Number(event.colno || 0)
  }));
  addEventListener('unhandledrejection', event => reportError('unhandledrejection', event.reason));
}

export { APP_VERSION, installObservability, reportError };

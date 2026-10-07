const ENVIRONMENTS = Object.freeze({
  development: Object.freeze({
    name: 'development',
    serviceBaseUrl: 'https://migrandia-dev.avaldiviezoch.workers.dev'
  }),
  production: Object.freeze({
    name: 'production',
    serviceBaseUrl: 'https://migrandia-api.avaldiviezoch.workers.dev'
  })
});

const PRODUCTION_HOSTS = new Set([
  'migrandiapp.com',
  'www.migrandiapp.com',
  'wedding.avaldiviezoch.workers.dev'
]);

function currentEnvironment() {
  const host = String(globalThis.location?.hostname || '').trim().toLowerCase();
  return PRODUCTION_HOSTS.has(host) ? ENVIRONMENTS.production : ENVIRONMENTS.development;
}

function serviceUrl(path, params = {}) {
  const environment = currentEnvironment();
  const url = new URL(String(path || '').replace(/^\/+/, ''), `${environment.serviceBaseUrl}/`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });
  return url.href;
}

export { currentEnvironment, serviceUrl };

const PLATFORM_LIMITS_VERSION = 1;

const PLATFORM_LIMITS = Object.freeze({
  eventsPerUser: 20,
  guestsPerEvent: 2000,
  tablesPerEvent: 250,
  ideasPerEvent: 500,
  providersPerEvent: 300,
  rsvpResponsesPerEvent: 5000,
  imagesPerEvent: 500,
  distributionObjectsPerEvent: 2000,
  serializedEntryBytes: 750000,
  imageBytes: 10 * 1024 * 1024
});

function getPlatformLimit(name) {
  return Number(PLATFORM_LIMITS[String(name || '')] || 0);
}

function isWithinPlatformLimit(name, count) {
  const limit = getPlatformLimit(name);
  const value = Number(count);
  if (!limit || !Number.isFinite(value) || value < 0) return false;
  return value <= limit;
}

function assertWithinPlatformLimit(name, count) {
  const limit = getPlatformLimit(name);
  const value = Number(count);

  if (!limit) {
    throw new Error('Límite de plataforma desconocido.');
  }
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Valor de límite inválido.');
  }
  if (value > limit) {
    throw new Error(`Se alcanzó el límite técnico de ${limit} para ${name}.`);
  }

  return true;
}

function serializedSizeBytes(value) {
  const serialized = JSON.stringify(value ?? null);
  return new TextEncoder().encode(serialized).byteLength;
}

function assessSerializedEntry(value) {
  const bytes = serializedSizeBytes(value);
  const limit = PLATFORM_LIMITS.serializedEntryBytes;
  return Object.freeze({
    bytes,
    limit,
    withinLimit: bytes <= limit
  });
}

export {
  PLATFORM_LIMITS_VERSION,
  PLATFORM_LIMITS,
  getPlatformLimit,
  isWithinPlatformLimit,
  assertWithinPlatformLimit,
  serializedSizeBytes,
  assessSerializedEntry
};

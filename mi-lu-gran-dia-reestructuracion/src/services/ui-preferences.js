import { auth } from './firebase-client.js';

const STORAGE_PREFIX = 'migrandia_ui_preferences_v1';

function storageKey() {
  const uid = String(auth.currentUser?.uid || '').trim();
  return uid ? `${STORAGE_PREFIX}:${uid}` : '';
}

function readAll() {
  const key = storageKey();
  if (!key) return {};
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const value = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function writeAll(value) {
  const key = storageKey();
  if (!key) return false;
  try {
    localStorage.setItem(key, JSON.stringify(value && typeof value === 'object' ? value : {}));
    return true;
  } catch {
    return false;
  }
}

function readUiPreference(name, fallback = '') {
  const key = String(name || '').trim();
  if (!key) return fallback;
  const value = readAll()[key];
  return value === undefined || value === null || value === '' ? fallback : value;
}

function writeUiPreference(name, value) {
  const key = String(name || '').trim();
  if (!key) return false;
  const current = readAll();
  current[key] = value;
  return writeAll(current);
}

export { readUiPreference, writeUiPreference };

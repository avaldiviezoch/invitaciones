import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { auth, db } from './firebase-client.js';
import { normalizeWeddingRole } from '../core/app/permissions.js';

async function readMembership(weddingId, uid) {
  if (!weddingId || !uid) return null;
  const snapshot = await getDoc(doc(db, 'weddings', weddingId, 'members', uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data() || {};
  return data.status === 'removed' ? null : data;
}

async function readWeddingContextById(weddingId, uid, indexData = {}) {
  const [membership, weddingSnapshot] = await Promise.all([
    readMembership(weddingId, uid),
    getDoc(doc(db, 'weddings', weddingId))
  ]);
  if (!membership || !weddingSnapshot.exists()) return null;
  const wedding = weddingSnapshot.data() || {};
  return {
    id: weddingId,
    name: String(wedding.name || membership.weddingName || indexData.name || 'Mi boda'),
    date: String(wedding.date || indexData.date || ''),
    role: normalizeWeddingRole(membership.role || indexData.role),
    ownerUid: String(wedding.ownerUid || indexData.ownerUid || '')
  };
}

async function listWeddingContexts(user = auth.currentUser) {
  if (!user) return [];
  const snapshots = await getDocs(collection(db, 'users', user.uid, 'weddings'));
  const contexts = await Promise.all(snapshots.docs.map((snapshot) =>
    readWeddingContextById(snapshot.id, user.uid, snapshot.data() || {})
  ));
  return contexts.filter(Boolean);
}

async function loadActiveWeddingContext(user = auth.currentUser) {
  if (!user) return null;
  const profileSnapshot = await getDoc(doc(db, 'users', user.uid));
  const profile = profileSnapshot.exists() ? profileSnapshot.data() || {} : {};
  const requestedId = String(profile.activeWeddingId || '');
  if (requestedId) {
    const indexSnapshot = await getDoc(doc(db, 'users', user.uid, 'weddings', requestedId));
    const context = await readWeddingContextById(requestedId, user.uid, indexSnapshot.exists() ? indexSnapshot.data() || {} : {});
    if (context) return context;
  }
  return (await listWeddingContexts(user))[0] || null;
}

async function selectActiveWedding(weddingId, user = auth.currentUser) {
  if (!user) throw new Error('Debes iniciar sesión.');
  const indexSnapshot = await getDoc(doc(db, 'users', user.uid, 'weddings', weddingId));
  const context = await readWeddingContextById(weddingId, user.uid, indexSnapshot.exists() ? indexSnapshot.data() || {} : {});
  if (!context) throw new Error('No tienes acceso a esa boda.');
  await updateDoc(doc(db, 'users', user.uid), {
    activeWeddingId: weddingId,
    lastSeenAt: serverTimestamp()
  });
  return context;
}

async function updateWeddingIdentity(context, changes = {}) {
  const user = auth.currentUser;
  if (!user || !context?.id) throw new Error('No hay una boda activa.');
  if (normalizeWeddingRole(context.role) !== 'owner') throw new Error('Solo el propietario puede modificar el nombre o la fecha de esta boda.');
  const patch = { updatedAt: serverTimestamp() };
  if (Object.hasOwn(changes, 'name')) {
    const name = String(changes.name || '').trim();
    if (!name) throw new Error('Escribe un nombre para la boda.');
    patch.name = name;
  }
  if (Object.hasOwn(changes, 'date')) {
    const date = String(changes.date || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('La fecha no es válida.');
    patch.date = date;
  }
  await updateDoc(doc(db, 'weddings', context.id), patch);
  return { ...context, ...changes };
}

export { listWeddingContexts, loadActiveWeddingContext, selectActiveWedding, updateWeddingIdentity };

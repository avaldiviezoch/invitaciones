import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  updateDoc,
  setDoc
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { auth, db } from './firebase-client.js';
import { normalizeWeddingRole, weddingCapabilities } from '../core/app/permissions.js';

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



async function createWedding({ name, date = '' } = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Debes iniciar sesión.');
  const cleanName = String(name || '').trim();
  if (!cleanName) throw new Error('Escribe un nombre para la boda.');
  const weddingRef = doc(collection(db, 'weddings'));
  const weddingId = weddingRef.id;
  const cleanDate = String(date || '');
  const batch = writeBatch(db);
  batch.set(weddingRef, { name: cleanName, date: cleanDate, ownerUid: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), version: 1 });
  batch.set(doc(db, 'weddings', weddingId, 'members', user.uid), { uid: user.uid, email: String(user.email || '').toLowerCase(), displayName: user.displayName || '', role: 'owner', status: 'active', weddingName: cleanName, joinedAt: serverTimestamp() });
  batch.set(doc(db, 'users', user.uid, 'weddings', weddingId), { weddingId, name: cleanName, date: cleanDate, role: 'owner', ownerUid: user.uid, addedAt: serverTimestamp() });
  batch.set(doc(db, 'users', user.uid), { activeWeddingId: weddingId, lastSeenAt: serverTimestamp() }, { merge: true });
  await batch.commit();
  return { id: weddingId, name: cleanName, date: cleanDate, role: 'owner' };
}

async function listPendingInvitations() {
  const user = auth.currentUser;
  if (!user?.email) return [];
  const snapshots = await getDocs(query(collection(db, 'invitations'), where('email', '==', String(user.email).toLowerCase())));
  return snapshots.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() })).filter((item) => item.status === 'pending');
}

async function acceptWeddingInvitation(inviteId) {
  const user = auth.currentUser;
  if (!user?.email) throw new Error('Debes iniciar sesión.');
  const inviteRef = doc(db, 'invitations', String(inviteId || ''));
  const snapshot = await getDoc(inviteRef);
  if (!snapshot.exists()) throw new Error('La invitación ya no existe.');
  const invite = snapshot.data() || {};
  if (String(invite.email || '').toLowerCase() !== String(user.email).toLowerCase()) throw new Error('Esta invitación pertenece a otra cuenta.');
  if (invite.status !== 'pending') throw new Error('Esta invitación ya fue utilizada.');
  const weddingId = String(invite.weddingId || '');
  const role = normalizeWeddingRole(invite.role);
  const weddingName = String(invite.weddingName || 'Boda compartida');
  const batch = writeBatch(db);
  batch.set(doc(db, 'weddings', weddingId, 'members', user.uid), { uid: user.uid, email: String(user.email).toLowerCase(), displayName: user.displayName || '', role, status: 'active', weddingName, joinedAt: serverTimestamp() }, { merge: true });
  batch.set(doc(db, 'users', user.uid, 'weddings', weddingId), { weddingId, name: weddingName, role, ownerUid: invite.invitedBy || '', addedAt: serverTimestamp() }, { merge: true });
  batch.set(inviteRef, { status: 'accepted', acceptedBy: user.uid, acceptedAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
  batch.set(doc(db, 'users', user.uid), { activeWeddingId: weddingId, lastSeenAt: serverTimestamp() }, { merge: true });
  await batch.commit();
  return { id: weddingId, name: weddingName, role };
}

function invitationId(weddingId, email) {
  return `${weddingId}__${String(email || '').trim().toLowerCase()}`;
}

async function listWeddingMembers(context) {
  if (!auth.currentUser || !context?.id) return [];
  const snapshots = await getDocs(collection(db, 'weddings', context.id, 'members'));
  return snapshots.docs
    .map((snapshot) => ({ uid: snapshot.id, ...snapshot.data() }))
    .filter((member) => member.status !== 'removed')
    .sort((a, b) => {
      if (a.role === 'owner') return -1;
      if (b.role === 'owner') return 1;
      return String(a.displayName || a.email || '').localeCompare(String(b.displayName || b.email || ''), 'es');
    });
}

async function listWeddingInvitations(context) {
  if (!auth.currentUser || !context?.id || !weddingCapabilities(context.role).canManageTeam) return [];
  const snapshots = await getDocs(query(collection(db, 'invitations'), where('weddingId', '==', context.id)));
  return snapshots.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }))
    .filter((item) => item.status === 'pending')
    .sort((a, b) => String(a.email || '').localeCompare(String(b.email || ''), 'es'));
}

async function inviteWeddingMember(context, email, role = 'viewer') {
  const user = auth.currentUser;
  const capabilities = weddingCapabilities(context?.role);
  if (!user || !context?.id || !capabilities.canManageTeam) throw new Error('No tienes permiso para gestionar accesos.');
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) throw new Error('Escribe un correo válido.');
  if (normalizedEmail === String(user.email || '').toLowerCase()) throw new Error('Tu cuenta ya pertenece a esta boda.');
  const cleanRole = normalizeWeddingRole(role);
  if (cleanRole === 'owner') throw new Error('El rol Propietario no se puede asignar.');
  if (cleanRole === 'admin' && !capabilities.canAssignAdmin) throw new Error('Solo el propietario puede asignar administradores.');
  const id = invitationId(context.id, normalizedEmail);
  await setDoc(doc(db, 'invitations', id), {
    weddingId: context.id,
    weddingName: context.name || 'Mi boda',
    email: normalizedEmail,
    role: cleanRole,
    status: 'pending',
    invitedBy: user.uid,
    invitedByEmail: String(user.email || '').toLowerCase(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

async function updateWeddingMemberRole(context, uid, role) {
  const user = auth.currentUser;
  const capabilities = weddingCapabilities(context?.role);
  if (!user || !context?.id || !capabilities.canManageTeam) throw new Error('No tienes permiso para gestionar accesos.');
  if (!uid || uid === user.uid) throw new Error('No puedes cambiar tu propio rol.');
  const memberRef = doc(db, 'weddings', context.id, 'members', uid);
  const snapshot = await getDoc(memberRef);
  if (!snapshot.exists()) throw new Error('Ese usuario ya no pertenece a la boda.');
  const currentRole = normalizeWeddingRole(snapshot.data()?.role);
  const cleanRole = normalizeWeddingRole(role);
  if (currentRole === 'owner' || cleanRole === 'owner') throw new Error('El rol del propietario no se puede modificar.');
  if (!capabilities.canAssignAdmin && (currentRole === 'admin' || cleanRole === 'admin')) throw new Error('Solo el propietario puede administrar el rol Administrador.');
  await setDoc(memberRef, { role: cleanRole, updatedAt: serverTimestamp() }, { merge: true });
}

async function removeWeddingMember(context, uid) {
  const user = auth.currentUser;
  const capabilities = weddingCapabilities(context?.role);
  if (!user || !context?.id || !capabilities.canManageTeam) throw new Error('No tienes permiso para gestionar accesos.');
  if (!uid || uid === user.uid) throw new Error('No puedes retirar tu propio acceso.');
  const memberRef = doc(db, 'weddings', context.id, 'members', uid);
  const snapshot = await getDoc(memberRef);
  if (!snapshot.exists()) return;
  const currentRole = normalizeWeddingRole(snapshot.data()?.role);
  if (currentRole === 'owner') throw new Error('No se puede retirar al propietario.');
  if (!capabilities.canAssignAdmin && currentRole === 'admin') throw new Error('Solo el propietario puede retirar a otro administrador.');
  await setDoc(memberRef, { status: 'removed', removedAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
}

async function cancelWeddingInvitation(context, inviteId) {
  if (!auth.currentUser || !context?.id || !weddingCapabilities(context.role).canManageTeam) throw new Error('No tienes permiso para gestionar accesos.');
  const ref = doc(db, 'invitations', String(inviteId || ''));
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return;
  if (String(snapshot.data()?.weddingId || '') !== context.id) throw new Error('La invitación no pertenece a esta boda.');
  await deleteDoc(ref);
}

export {
  listWeddingContexts, loadActiveWeddingContext, selectActiveWedding, updateWeddingIdentity,
  createWedding, listPendingInvitations, acceptWeddingInvitation,
  listWeddingMembers, listWeddingInvitations, inviteWeddingMember,
  updateWeddingMemberRole, removeWeddingMember, cancelWeddingInvitation
};

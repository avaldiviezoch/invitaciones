import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { auth, db } from './firebase-client.js';

const COLLECTION = 'invitations';

function invitationsRef(uid) {
  if (!uid) throw new Error('No hay usuario autenticado.');
  return collection(db, 'users', uid, COLLECTION);
}

function normalizeInvitation(id, data = {}) {
  return {
    id,
    name: String(data.name || 'Invitación'),
    url: String(data.url || ''),
    principal: Boolean(data.principal),
    source: String(data.source || 'user'),
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null
  };
}

function subscribePersonalInvitations(onValue, onError) {
  const uid = auth.currentUser?.uid;
  if (!uid) return () => {};

  return onSnapshot(
    invitationsRef(uid),
    (snapshot) => {
      const items = snapshot.docs
        .map((item) => normalizeInvitation(item.id, item.data()))
        .filter((item) => item.url)
        .sort((a, b) => {
          const aTime = a.updatedAt?.toMillis?.() || 0;
          const bTime = b.updatedAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
      onValue?.(items);
    },
    (error) => onError?.(error)
  );
}

async function addPersonalInvitation({ name, url }) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('No hay usuario autenticado.');

  const cleanUrl = String(url || '').trim();
  const cleanName = String(name || '').trim() || 'Invitación';

  if (!/^https?:\/\//i.test(cleanUrl)) {
    throw new Error('Ingresa un enlace válido que empiece por http:// o https://.');
  }

  const ref = doc(invitationsRef(uid));
  await setDoc(ref, {
    name: cleanName,
    url: cleanUrl,
    principal: false,
    source: 'user',
    ownerUid: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return normalizeInvitation(ref.id, {
    name: cleanName,
    url: cleanUrl,
    principal: false,
    source: 'user'
  });
}

async function deletePersonalInvitation(id) {
  const uid = auth.currentUser?.uid;
  if (!uid || !id) return;
  await deleteDoc(doc(db, 'users', uid, COLLECTION, id));
}

export {
  subscribePersonalInvitations,
  addPersonalInvitation,
  deletePersonalInvitation
};

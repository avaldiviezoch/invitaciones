import { readFileSync } from 'node:fs';
import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

let env;
const event = 'eventA';
const draftPath = (eventId) => ['weddings', eventId, 'invitationDrafts', 'draft1'];
const valid = (uid = 'owner') => ({
  ownerUid:uid, eventId:event, revision:'1', updatedAt: new Date(),
  value:{ schema:'migrandia-invitation-draft-v1', eventType:'wedding',
    eventName:'Boda', date:'', location:'', guestName:'', message:'',
    templateId:'classic-elegant', fontStyle:'serif', colorPalette:'auto' }
});
function db(uid) { return uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore(); }
async function seed() {
  await env.withSecurityRulesDisabled(async (context) => {
    const database=context.firestore();
    for (const [id, members] of [['eventA',{ owner:'owner',admin:'admin',editor:'editor',viewer:'viewer',provider:'provider',inactive:'editor' }],['eventB',{ other:'owner' }]]) {
      await setDoc(doc(database,'weddings',id),{ name:id });
      for (const [uid,role] of Object.entries(members)) {
        await setDoc(doc(database,'weddings',id,'members',uid),{ role,status:uid==='inactive'?'inactive':'active' });
      }
    }
  });
}
before(async () => {
  env=await initializeTestEnvironment({ projectId:'demo-mgd021-invitation-drafts',
    firestore:{host:'127.0.0.1',port:8080,rules:readFileSync(new URL('./firestore.rules',import.meta.url),'utf8')} });
});
beforeEach(async () => { await env.clearFirestore(); await seed(); });
after(async () => { await env?.cleanup(); });

test('owner/admin/editor pueden crear y leer borradores de su evento', async () => {
  for (const uid of ['owner','admin','editor']) {
    await assertSucceeds(setDoc(doc(db(uid),...draftPath(event)),valid(uid)));
    await assertSucceeds(getDoc(doc(db(uid),...draftPath(event))));
    await env.withSecurityRulesDisabled(async ctx => { await deleteDoc(doc(ctx.firestore(),...draftPath(event))); });
  }
});
test('viewer/provider solo leen; otros ni siquiera leen', async () => {
  await assertSucceeds(setDoc(doc(db('owner'),...draftPath(event)),valid()));
  for (const uid of ['viewer','provider']) {
    await assertSucceeds(getDoc(doc(db(uid),...draftPath(event))));
    await assertFails(updateDoc(doc(db(uid),...draftPath(event)),{'value.message':'cambio'}));
    await assertFails(deleteDoc(doc(db(uid),...draftPath(event))));
  }
  for (const uid of ['other','inactive',null]) {
    await assertFails(getDoc(doc(db(uid),...draftPath(event))));
    await assertFails(setDoc(doc(db(uid),...draftPath(event)),valid(uid || 'anon')));
  }
  await assertFails(getDoc(doc(db('owner'),...draftPath('eventB'))));
});
test('no permitir mutar owner/evento, campos extra, revisión obsoleta ni payload largo', async () => {
  const ref=doc(db('owner'),...draftPath(event));
  await assertSucceeds(setDoc(ref,valid()));
  await assertFails(updateDoc(ref,{ownerUid:'admin',revision:'2'}));
  await assertFails(updateDoc(ref,{eventId:'eventB',revision:'2'}));
  await assertFails(updateDoc(ref,{revision:'3'}));
  await assertFails(updateDoc(ref,{'value.message':'x'.repeat(241),revision:'2'}));
  await assertFails(updateDoc(ref,{'value.extra':'illegal',revision:'2'}));
  await assertSucceeds(updateDoc(ref,{'value.message':'válido',revision:'2'}));
  const result=await assertSucceeds(getDoc(ref));
  assert.equal(result.data().revision,'2');
});

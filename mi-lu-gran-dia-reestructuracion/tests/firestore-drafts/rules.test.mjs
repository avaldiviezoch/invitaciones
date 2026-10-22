import { readFileSync } from 'node:fs';
import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { createEventInvitationDraftPort } from '../../src/services/event-invitation-drafts-firestore.js';
import { createEventInvitationDraftSession } from '../../src/services/event-invitation-draft-session.js';

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


test('colaboración: los editores mantienen autoría y los espectadores no escriben', async () => {
  const original=doc(db('owner'),...draftPath('eventA'));
  await assertSucceeds(setDoc(original,valid('owner')));
  for (const uid of ['admin','editor']) {
    const editable=doc(db(uid),...draftPath('eventA'));
    const revision=uid==='admin'?'2':'3';
    await assertSucceeds(updateDoc(editable,{'value.message':'Editado por '+uid,revision}));
    const found=await assertSucceeds(getDoc(editable));
    assert.equal(found.data().ownerUid,'owner');
    assert.equal(found.data().revision,revision);
  }
  for (const uid of ['viewer','provider']) {
    const blocked=doc(db(uid),...draftPath('eventA'));
    await assertFails(setDoc(blocked,{...valid(uid),revision:'4'}));
    await assertFails(deleteDoc(blocked));
  }
  await assertSucceeds(deleteDoc(doc(db('editor'),...draftPath('eventA'))));
});

test('aislamiento A → B → A: una cuenta ajena nunca ve el borrador de otro evento', async () => {
  await assertSucceeds(setDoc(doc(db('owner'),...draftPath('eventA')),valid('owner')));
  await assertFails(getDoc(doc(db('owner'),...draftPath('eventB'))));
  await assertFails(getDoc(doc(db('other'),...draftPath('eventA'))));
  await assertSucceeds(setDoc(doc(db('other'),...draftPath('eventB')),
    {...valid('other'),eventId:'eventB'}));
  await assertFails(getDoc(doc(db('owner'),...draftPath('eventB'))));
  const restored=await assertSucceeds(getDoc(doc(db('owner'),...draftPath('eventA'))));
  assert.equal(restored.data().value.eventName,'Boda');
  assert.equal(restored.data().ownerUid,'owner');
});

test('creación: no se puede falsificar propietario, evento ni esquema', async () => {
  const a=doc(db('editor'),...draftPath('eventA'));
  await assertFails(setDoc(a,valid('owner')));
  await assertFails(setDoc(a,{...valid('editor'),eventId:'eventB'}));
  await assertFails(setDoc(a,{...valid('editor'),revision:'2'}));
  await assertFails(setDoc(a,{...valid('editor'),value:{...valid().value,schema:'desconocido'}}));
  await assertFails(setDoc(a,{...valid('editor'),value:{...valid().value,eventName:12}}));
  await assertSucceeds(setDoc(a,valid('editor')));
});

test('actualización: revisión debe incrementarse solo de una en una', async () => {
  const a=doc(db('owner'),...draftPath('eventA'));
  await assertSucceeds(setDoc(a,valid()));
  await assertFails(updateDoc(a,{revision:'1'}));
  await assertFails(updateDoc(a,{revision:'3'}));
  await assertFails(updateDoc(a,{revision:'abc'}));
  await assertSucceeds(updateDoc(a,{revision:'2'}));
  await assertFails(updateDoc(a,{revision:'2'}));
  await assertSucceeds(updateDoc(a,{revision:'3'}));
});

const emulatorSdk = { collection, doc, getDoc, getDocs, runTransaction, serverTimestamp };

test('integración real emulador: puerto y sesión comparten borrador entre owner/editor', async () => {
  const ownerPort = createEventInvitationDraftPort({
    db:db('owner'), sdk:emulatorSdk, currentUid:()=>'owner', enabled:true
  });
  const editorPort = createEventInvitationDraftPort({
    db:db('editor'), sdk:emulatorSdk, currentUid:()=>'editor', enabled:true
  });
  const ownerSession = createEventInvitationDraftSession({
    repository:ownerPort, currentUid:()=>'owner', enabled:true,
    schedule:()=>1, cancel:()=>{}
  });
  const editorSession = createEventInvitationDraftSession({
    repository:editorPort, currentUid:()=>'editor', enabled:true,
    schedule:()=>1, cancel:()=>{}
  });
  try {
    ownerSession.select({eventId:'eventA',draftId:'draft1'});
    assert.equal(ownerSession.change(valid('owner').value),true);
    assert.equal(await ownerSession.flush(),true);
    assert.equal(ownerSession.status().revision,'1');
    editorSession.select({eventId:'eventA',draftId:'draft1'});
    const recovered = await editorSession.recover();
    assert.equal(recovered.eventName,'Boda');
    editorSession.change({...recovered,message:'Contenido compartido'});
    assert.equal(await editorSession.flush(),true);
    assert.equal(editorSession.status().revision,'2');
    const ownerRead = await ownerPort.read('eventA','draft1');
    assert.equal(ownerRead.ownerUid,'owner');
    assert.equal(ownerRead.value.message,'Contenido compartido');
    assert.equal(ownerRead.revision,'2');
    const viewerPort=createEventInvitationDraftPort({
      db:db('viewer'),sdk:emulatorSdk,currentUid:()=>'viewer',enabled:true
    });
    assert.equal((await viewerPort.read('eventA','draft1')).revision,'2');
    await assert.rejects(viewerPort.save('eventA','draft1',recovered,'2'));
  } finally {
    ownerSession.close();
    editorSession.close();
  }
});

test('integración real emulador: puerto aísla A → B → A y rechaza revisión obsoleta', async () => {
  const port=createEventInvitationDraftPort({
    db:db('owner'),sdk:emulatorSdk,currentUid:()=>'owner',enabled:true
  });
  const created=await port.save('eventA','draft1',valid('owner').value,'');
  assert.equal(created.revision,'1');
  await assert.rejects(port.read('eventB','draft1'));
  await assert.rejects(port.save('eventA','draft1',{...valid('owner').value,message:'obsoleto'},''));
  const restored=await port.read('eventA','draft1');
  assert.equal(restored.revision,'1');
  assert.equal(restored.value.eventName,'Boda');
});


test('revocación de permisos: editor pasa a viewer y luego a inactivo sin conservar escritura ni lectura', async () => {
  const path=draftPath('eventA');
  const ref=doc(db('editor'),...path);
  await assertSucceeds(setDoc(doc(db('owner'),...path), valid('owner')));
  await assertSucceeds(updateDoc(ref, {'value.message':'Editado con permiso',revision:'2'}));
  await env.withSecurityRulesDisabled(async ctx => {
    await updateDoc(doc(ctx.firestore(),'weddings','eventA','members','editor'),{role:'viewer'});
  });
  const readable=await assertSucceeds(getDoc(ref));
  assert.equal(readable.data().revision,'2');
  await assertFails(updateDoc(ref, {'value.message':'No autorizado',revision:'3'}));
  await assertFails(deleteDoc(ref));
  await env.withSecurityRulesDisabled(async ctx => {
    await updateDoc(doc(ctx.firestore(),'weddings','eventA','members','editor'),{status:'inactive'});
  });
  await assertFails(getDoc(ref));
  await assertFails(updateDoc(ref, {'value.message':'Sin sesión activa',revision:'3'}));
  await assertFails(getDocs(collection(db('editor'),'weddings','eventA','invitationDrafts')));
  const persisted=await assertSucceeds(getDoc(doc(db('owner'),...path)));
  assert.equal(persisted.data().revision,'2');
  assert.equal(persisted.data().value.message,'Editado con permiso');
});

test('roles por evento: pertenecer al evento A no concede permisos sobre B', async () => {
  const docA=doc(db('editor'),...draftPath('eventA'));
  const docB=doc(db('editor'),...draftPath('eventB'));
  await assertSucceeds(setDoc(docA,valid('editor')));
  await assertFails(getDoc(docB));
  await assertFails(setDoc(docB,{...valid('editor'),eventId:'eventB'}));
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(),'weddings','eventB','members','editor'),{role:'viewer',status:'active'});
  });
  await assertSucceeds(setDoc(doc(db('other'),...draftPath('eventB')),{...valid('other'),eventId:'eventB'}));
  await assertSucceeds(getDoc(docB));
  await assertFails(updateDoc(docB,{'value.message':'Sin permiso para editar B',revision:'2'}));
  await assertSucceeds(updateDoc(docA,{'value.message':'Con permiso en A',revision:'2'}));
});

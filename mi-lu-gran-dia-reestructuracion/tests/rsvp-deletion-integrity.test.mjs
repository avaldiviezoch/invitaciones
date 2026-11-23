import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const service = readFileSync(resolve(root, 'src/services/rsvp-admin.js'), 'utf8');
const diagnostic = readFileSync(resolve(root, 'diagnostico_rsvp_vs_invitados.html'), 'utf8');
const start = service.indexOf('function withoutRsvpLink(');
const end = service.indexOf('\nfunction canonicalCopy(', start);
assert.ok(start >= 0 && end > start, 'El servicio conserva una única función de desvinculación');
const sandbox = { guestStatus: (guest) => ['confirmed', 'declined', 'tentative'].includes(guest.status) ? guest.status : 'pending' };
vm.runInNewContext(service.slice(start, end) + '\nthis.clean = withoutRsvpLink;', sandbox);

test('elimina el vínculo y vuelve a pendiente si el estado lo generó el RSVP', () => {
  const input = { id: 'marcelino', name: 'Marcelino', status: 'confirmed', tableId: 'mesa-1',
    rsvpResponseId: 'respuesta-1', rsvpLinkedAt: '2026-11-23',
    rsvpTags: ['Confirmado'], notes: 'Nota personal\n[RSVP] Confirmado' };
  const result = sandbox.clean(input, 'respuesta-1', 'confirmed');
  assert.equal(result.status, 'pending');
  assert.equal(result.rsvpResponseId, undefined);
  assert.equal(result.rsvpLinkedAt, undefined);
  assert.equal(result.name, 'Marcelino');
  assert.equal(result.tableId, 'mesa-1');
  assert.equal(result.notes, 'Nota personal');
  assert.equal(input.status, 'confirmed', 'sin mutar la copia original');
});

test('no modifica invitado vinculado a otra respuesta', () => {
  const original = { id: 'lucy', status: 'confirmed', rsvpResponseId: 'otra-respuesta' };
  assert.deepEqual({ ...sandbox.clean(original, 'respuesta-1', 'confirmed') }, original);
});

test('conserva estado manual diferente al RSVP eliminado', () => {
  const original = { id: 'lucy', status: 'confirmed', rsvpResponseId: 'respuesta-2', notes: 'Familia' };
  const result = sandbox.clean(original, 'respuesta-2', 'declined');
  assert.equal(result.status, 'confirmed');
  assert.equal(result.rsvpResponseId, undefined);
});

test('el servicio elimina respuesta y gestión; la UI no escribe directamente esos documentos', () => {
  assert.match(service, /batch\.delete\(responseRef\)/);
  assert.match(service, /batch\.delete\(managementRef\)/);
  assert.match(service, /await saveInvitadosSnapshot\(context, changed\)/);
  assert.match(diagnostic, /await deleteRsvpResponseExceptional\(currentContext/);
  assert.match(diagnostic, /cleanOrphanedRsvpLinks\(currentContext,orphanGuestIds\)/);
});

test('la reparación histórica exige los IDs revisados y no modifica mesas', () => {
  assert.match(service, /expected\.length !== actual\.length/);
  assert.match(service, /throw new Error\('El diagnóstico cambió/);
  assert.match(service, /hasRsvpEvidence/);
  assert.doesNotMatch(service.slice(start, end), /delete next\.tableId/);
});

# Pruebas aisladas de Firestore — MGD-021

El archivo `firestore.rules` de esta carpeta es una **fixture experimental**; **NO** representa las reglas actualmente desplegadas ni se debe publicar. La ruta estudiada es `weddings/{weddingId}/invitationDrafts/{draftId}`, compartida entre colaboradores autorizados.

Desde `mi-lu-gran-dia-reestructuracion`, con Node y Java instalados:

```bash
npm install --no-save @firebase/rules-unit-testing firebase firebase-tools
npx firebase emulators:exec --project demo-mgd021-invitation-drafts --only firestore --config tests/firestore-drafts/firebase.json "node --test tests/firestore-drafts/rules.test.mjs"
```

Utiliza exclusivamente el emulador en `127.0.0.1:8080` y proyecto `demo-*`; **nunca** apuntar a `migrandia`. La suite está conectada a un workflow **aislado** de GitHub Actions, ejecutable manualmente o al cambiar los archivos de este fixture. No equivale a verificar las reglas desplegadas. Confirma el resultado verde de ese workflow antes de considerar el ensayo superado. Revisar sintaxis/compatibilidad con el emulador antes de confiar en cualquier resultado. No modifica el adaptador ni habilita escrituras.

**Bloqueo posterior:** decidir migración desde la ruta antigua de borradores (todavía no usada) y comprobar reglas reales de Firebase antes de crear un cambio desplegable.

## Ampliación de matriz — 2026-10-20

La suite cubre además edición por administrador/editor manteniendo `ownerUid`, bloqueo de viewer/provider, A→B→A con usuarios exclusivos por evento, creación con propietario/evento falsificado y revisiones que omiten números o repiten la misma versión. Solo son pruebas del emulador y de la fixture; no prueban reglas de producción.

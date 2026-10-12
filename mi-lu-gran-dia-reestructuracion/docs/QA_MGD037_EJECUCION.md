# MGD-037 — Ejecución de QA autenticado (solo cuenta ficticia)

**Estado:** procedimiento disponible; todavía no hay ejecución A → B → A aprobada. DEV únicamente. No usar una cuenta personal ni una boda existente.

## 1. Preparar datos exclusivamente de QA

1. Crear una cuenta NUEVA y EXCLUSIVA de pruebas; no conceder acceso a bodas reales. No usar un correo de cuenta productiva.
2. En la URL de DEV publicada, crear dos eventos ficticios que pertenezcan a esa cuenta:
   - **A:** Boda con nombre que comienza por `QA-`.
   - **B:** Cumpleaños con nombre que comienza por `QA-`.
3. En cada evento insertar manualmente datos reconocibles y sin información personal: un marcador `QA-` de Invitados, uno **distinto** de Presupuesto y un nombre de Mesa **distinto**; usar valores separados en A y B. Los marcadores deben verse en las pantallas de los módulos correspondientes, no solo estar en Firebase.
4. Obtener los dos IDs desde los registros de eventos de la cuenta QA (nunca inferirlos del nombre). Dejar **A como evento activo** antes de comenzar. **La cuenta debe tener exactamente dos eventos en «Mis eventos»: A y B.** Si hay otros eventos, no ejecutar el test; usar otra cuenta QA completamente aislada. No ejecutar sobre producción.

## 2. Preparar Playwright local (Windows PowerShell)

Abrir PowerShell en `mi-lu-gran-dia-reestructuracion`. Requiere Node.js y Git ya instalados. El navegador de prueba y las sesiones se almacenan solo en el equipo de QA.

```powershell
npm install
npx playwright install chromium
npm run auth:e2e:capture
```

En la ventana de captura, ingresar **solo con la cuenta ficticia de QA**. El comando genera `tests/.auth/storage-state.json` local; confirmar antes de continuar que este archivo NO se agregará a Git, se enviará por correo o se subirá a Actions. Si el inicio de sesión falla o la cuenta abierta no es exclusiva de QA, detenerse.

Configurar variables **en la misma terminal**, con IDs y marcadores propios de la cuenta ficticia:

```powershell
$env:MGD_QA_FIXTURE_ACCOUNT_EMAIL = "qa-ejemplo@correo.test"
$env:MGD_QA_FIXTURE_EVENT_A = "ID_REAL_DEL_EVENTO_FICTICIO_A"
$env:MGD_QA_FIXTURE_EVENT_B = "ID_REAL_DEL_EVENTO_FICTICIO_B"
$env:MGD_QA_FIXTURE_MARKER_A = "QA-INV-A"
$env:MGD_QA_FIXTURE_MARKER_B = "QA-INV-B"
$env:MGD_QA_FIXTURE_BUDGET_MARKER_A = "QA-GASTO-A"
$env:MGD_QA_FIXTURE_BUDGET_MARKER_B = "QA-GASTO-B"
$env:MGD_QA_FIXTURE_TABLE_MARKER_A = "QA-MESA-A"
$env:MGD_QA_FIXTURE_TABLE_MARKER_B = "QA-MESA-B"
```

Los valores anteriores son **ejemplos**, no fixtures creados ni IDs operativos. No copiar marcadores que no existan en la aplicación.

## 3. Orden de ejecución (sin saltarse puertas de seguridad)

Primero comprobar que Playwright descubre los tests, sin realizar ninguna operación:

```powershell
npm run test:e2e:fixture-preflight -- --list
npm run test:e2e:fixture-switch -- --list
```

Habilitar **solo** la lectura previa de datos ficticios:

```powershell
$env:MGD_QA_FIXTURE_PREFLIGHT = "READ_ONLY_TEST_ONLY"
npm run test:e2e:fixture-preflight
```

El preflight verifica que B existe, que es un **Cumpleaños QA-** distinto de A, que no está activo y que no hay terceros eventos, sin conmutar a B.

**Si el preflight no está verde, detenerse.** Revisar identidad de cuenta, evento A activo y que los marcadores propios de Invitados, Presupuesto y Distribución aparezcan visualmente. No relajar aserciones para forzar un verde.

Solo tras pasar el preflight y comprobar otra vez que se trata de cuenta y eventos exclusivamente ficticios, autorizar el cambio de contexto:

```powershell
$env:MGD_QA_FIXTURE_SWITCH = "AUTHORIZED_TEST_ONLY"
npm run test:e2e:fixture-switch
```

**Aviso:** los escenarios de cambio escriben `activeWeddingId` en Firestore de la cuenta exclusiva de QA. No son pruebas de solo lectura. La batería comprueba regreso al evento A, temas y marcadores de los módulos A/B/A, sin crear ni borrar fixtures. Verificar también la reentrada en móvil con la misma cuenta de prueba antes de dar el hito por aprobado.

## 4. Evidencia y cierre

Registrar fecha, commit DEV publicado, versión del navegador, IDs ficticios **redactados** (solo prefijos), resultado del preflight y de los tres escenarios de conmutación, pantallas revisadas en móvil/escritorio, errores de consola y capturas sin datos sensibles. Las capturas y el estado autenticado no deben publicarse en PR ni artefactos de CI públicos.

Si falla una prueba, documentar módulo/paso y abrir corrección en DEV; no promover a PROD. Para cerrar MGD-037 es imprescindible QA auténtico de aislamiento, persistencia de A después de B, permisos y responsive. La ejecución de `--list` o de `test:e2e:safe` nunca sustituye ese cierre.

Para salir de la sesión PowerShell: `Remove-Item Env:MGD_QA_FIXTURE_SWITCH -ErrorAction SilentlyContinue` y borrar el archivo de sesión de forma segura cuando termine el QA.

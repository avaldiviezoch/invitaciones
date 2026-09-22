# Inicio · alcance controlado

Primera cara de la reestructuración.

- Reutiliza el video actual.
- Reutiliza exclusivamente Firebase Authentication del proyecto actual.
- No importa Firestore, Storage ni código de persistencia.
- No crea cuentas por correo; el formulario solo inicia sesión con usuarios existentes.
- No lee ni escribe colecciones, documentos, backups ni claves de datos.
- Los botones de módulos son objetivos de monkey test y todavía no navegan.
- Estructura deliberadamente mínima: un HTML de entrada, un CSS del módulo y un JS del módulo.
- Después de validar escritorio se revisará responsive/móvil antes de avanzar al siguiente módulo.

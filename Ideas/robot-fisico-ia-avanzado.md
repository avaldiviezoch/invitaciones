# Robot físico avanzado con inteligencia artificial — Idea de proyecto

**Fecha de registro:** 29 de octubre de 2026  
**Estado:** Investigación y planificación; sin compras ni implementación aprobadas  
**Ubicación:** Portafolio de ideas; proyecto independiente de Mi Gran Día  
**Prioridad:** Retomar sin desviar los MGD pendientes.

## 1. Visión
Construir un compañero físico de escritorio, inspirado en los prototipos DIY tipo *desk buddy* con ESP32, pero con capacidades avanzadas: conversación natural, pantalla con ojos expresivos, cámara, reconocimiento visual, sensores, voz, movimiento de cabeza y acciones autorizadas sobre una computadora.

No se trata de un chatbot web: debe existir como dispositivo físico con personalidad, interfaz visual y electrónica propia. La primera versión permanece fija sobre el escritorio; ruedas y navegación autónoma son ampliaciones posteriores.

## 2. Funciones deseadas
- Conversación bidireccional con voz, interrupciones y baja latencia.
- Pantalla TFT con ojos, parpadeo, expresiones y estados (reposo, escucha, pensamiento, respuesta, error).
- Micrófono, amplificador y parlante.
- Cámara para detección de personas/objetos y seguimiento de rostro.
- Cabeza móvil mediante dos servomotores (pan/tilt), con límites y calibración.
- Sensores de presencia o distancia, botones y controles físicos.
- Memoria persistente y configurable; almacenamiento de preferencias y proyectos autorizados.
- Conectividad Wi-Fi, panel web de administración y actualizaciones.
- Integración con computadora: abrir aplicaciones, consultar archivos y ejecutar herramientas **solo con permisos y confirmaciones**, registro de acciones y sin ejecución irrestricta.
- Automatizaciones y ampliaciones futuras (sensores, carcasa definitiva, movilidad).

## 3. Arquitectura propuesta
**Primera arquitectura:** ESP32-S3 N16R8 como controlador físico + aplicación Python en PC como cerebro + interfaz de administración HTML/CSS/JavaScript. Comunicación por Wi-Fi/WebSocket o protocolo adecuado. API de IA para conversación/visión cuando sea necesario.

**Arquitectura futura:** Raspberry Pi 5 para autonomía respecto de la PC. El procesamiento local tiene límites: modelos grandes y visión avanzada pueden requerir API o equipo más potente.

**Modelo híbrido:** animaciones, sensores, movimientos y órdenes simples locales; servicios de IA externos para consultas complejas. Evaluar STT, TTS, VAD, manejo de eco, streaming de audio, memoria y herramientas. Mantener claves API en el backend, nunca en el firmware público.

## 4. Lista preliminar de hardware
| Elemento | Presupuesto referencial (S/) |
| --- | ---: |
| ESP32-S3 N16R8 | 85–110 |
| Pantalla TFT | 25–55 |
| Cámara compatible | 25–65 |
| Micrófono I2S | 10–25 |
| Amplificador I2S | 10–20 |
| Parlante | 8–20 |
| Dos servos MG90S | 30–40 |
| Controlador PWM | 12–25 |
| Sensor de presencia/distancia | 10–35 |
| Botones, LED e interruptor | 10–25 |
| Fuente y regulación | 30–60 |
| Cables, conectores y protoboard | 25–50 |
| Carcasa impresa en 3D | 50–120 |

**Presupuesto de planificación:** aproximadamente S/ 380–700 con margen de imprevistos, usando la PC como cerebro. Con Raspberry Pi 5 y accesorios, presupuesto global preliminar S/ 1,350–1,800. Son rangos orientativos, **no cotizaciones ni una lista final de compra**; validar precios, compatibilidades, envío y disponibilidad en Perú antes de comprar. No incluyen necesariamente herramientas, batería ni costos recurrentes.

## 5. Inteligencia artificial y costos
- ChatGPT Plus no incluye acceso gratuito a la API de OpenAI ni se puede migrar directamente al robot.
- La API de OpenAI se factura según uso; validar precios oficiales actuales antes de implementar.
- Evaluar modelo local en PC para reducir costo, sujeto a la potencia del equipo.
- Preferir arquitectura híbrida y presupuesto/alertas de consumo.
- Referencia inicial de **límite de pruebas**: S/ 20–80 al mes; no es una predicción garantizada.
- El historial, memorias y contexto de ChatGPT **no se transfieren automáticamente**: seleccionar, exportar y autorizar explícitamente el conocimiento que se incorporará a la memoria del robot.

## 6. Dificultades y riesgos
1. **Audio en tiempo real (alta):** eco del parlante, ruido, detección de voz, interrupciones, latencia y sincronización.
2. **Visión y movimiento (alta):** carga de procesamiento, seguimiento de rostro, servos suaves, calibración, límites mecánicos y privacidad.
3. **Alimentación y electrónica (alta):** picos de corriente de servos, masas comunes, reguladores adecuados, protección y reinicios.
4. **Orquestación IA (media-alta):** estado de conversación, reconexión, fallos de API, memoria y control de herramientas.
5. **Operación continua (muy alta):** temperatura, consumo, recuperación de errores, actualizaciones y mantenimiento.
6. **Seguridad (crítica):** consentimiento para cámara/micrófono, indicador de captura, permisos mínimos, secretos fuera del dispositivo, confirmaciones de acciones sensibles, logs y opción de apagado físico.

## 7. Plan por fases
- **Fase 1 — Simulador HTML:** diseño de rostro, expresiones, panel de configuración y conversación simulada. Hardware S/ 0.
- **Fase 2 — Primer hardware:** ESP32-S3 + TFT + micrófono + parlante; validar alimentación, pantalla y audio.
- **Fase 3 — Visión y movimiento:** cámara, servos, seguimiento facial, sensores y carcasa.
- **Fase 4 — Agente de PC:** herramientas con permisos, memoria y administración web.
- **Fase 5 — Autonomía:** evaluar Raspberry Pi, arranque independiente, recuperación de fallos y eventual batería/movilidad.

**Criterio de avance:** no comprar todos los componentes de una vez; validar prototipos y compatibilidad por fase.

## 8. Software y referencias por evaluar
- Firmware ESP32-S3 en C++/ESP-IDF o Arduino según periféricos.
- Python para servicios de IA, visión y control de PC.
- HTML/CSS/JavaScript para simulador y administración.
- Proyectos de referencia: Xiaozhi ESP32, RIG-Omni (https://github.com/Xgorobot/RIG-Omni), proyectos de ojos animados y asistentes ESP32-S3.
- Revisar licencias, vigencia, pines, PSRAM, cámaras, audio y consumo antes de reutilizar código.

## 9. Decisiones pendientes
- Confirmar PC disponible, especificaciones y si permanecerá encendida.
- Elegir modelo exacto de pantalla, cámara y placa ESP32-S3, verificando pines y buses compartidos.
- Definir alimentación por USB/fuente y eventual batería.
- Definir carcasa, dimensiones, apariencia y movimiento.
- Evaluar proveedores y precios en Perú.
- Elegir motor de voz/IA y controles de gasto.
- Establecer política de privacidad, memoria y acciones sobre PC.

## 10. Encaje con el portafolio
Primero se plantea como **proyecto personal de aprendizaje y prototipado**, no como micro-SaaS ni fuente automática de ingresos. Una eventual comercialización de kits, software o asistentes se evaluará por separado, después de demostrar funcionamiento, costo y demanda. Mantener intacta la prioridad actual de Mi Gran Día y la metodología de validación del portafolio.

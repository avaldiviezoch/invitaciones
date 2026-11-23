# Proyecto de domótica del departamento
Actualizado: 23 de noviembre de 2026

## Objetivo
Implementar domótica con Home Assistant, priorizando funcionamiento local sin internet, control manual de luces, Zigbee y acceso desde iPhone. Primera etapa mínima: interruptores inteligentes; después, videotimbre.

## Distribución conocida
- Departamento en segundo piso: sala, habitación 1, habitación 2, habitación 3 y otros ambientes.
- En la sala hay cuatro luces independientes, cada una con su interruptor manual.
- Router Wi-Fi dentro del departamento, segundo piso.

## Etapa 1 — Interruptores inteligentes (prioridad inmediata)
- Preferencia confirmada: interruptores **táctiles**, idealmente de vidrio, no pulsadores físicos.
- Preferencia de protocolo: **Zigbee**, compatible con Home Assistant (ZHA o Zigbee2MQTT según modelo).
- Mantener encendido/apagado manual incluso sin internet.
- Cada luz requiere un canal de control; no es necesario un interruptor por foco si comparten circuito.
- Objetivo: poder apagar todas las luces de la sala desde un botón junto a la puerta, sin perder el control individual.
- Solución provisional: cuatro canales Zigbee para las cuatro luces y un controlador de escenas Zigbee con varios botones junto a la puerta. Alternativa: interruptor multibotón con modo desacoplado, solo si el modelo lo soporta.
- Escenas deseadas: encender sala, apagar sala, apagar todo el departamento.
- Marcas candidatas: BSEED y MOES táctiles Zigbee. Aqara H1 se evaluó, pero usa pulsadores físicos y no cumple la preferencia estética.
- **Pendiente antes de comprar:** comprobar presencia de neutro, dimensiones de cajas, circuitos, tensión nominal 220 V / 60 Hz, compatibilidad exacta con Home Assistant y eventos de escena. Comprar primero una unidad de prueba.
- Automatizaciones locales funcionan sin internet si router/red, coordinador Zigbee y Home Assistant siguen alimentados. Binding Zigbee directo puede reducir dependencia de Home Assistant en dispositivos compatibles.

## Base del sistema
- Home Assistant Green como centro de automatización previsto.
- Se necesita coordinador Zigbee compatible, si no está incluido.
- Integración prevista con Alexa y iPhone; algunas funciones remotas y de voz pueden requerir internet.
- Evitar dependencias obligatorias de nube para funciones esenciales.

## Etapa 2 — Videotimbre
- Timbre exclusivamente para el departamento, ubicado en entrada común del primer piso; instalación sujeta a autorización correspondiente.
- Conexión preferida: Wi-Fi, sin cable Ethernet desde el segundo piso.
- Hay punto eléctrico cercano; usar fuente adecuada, nunca conectar directamente 220 V a un dispositivo de baja tensión.
- Comprobar cobertura Wi-Fi 2,4 GHz desde el router del segundo piso.
- Requisitos: cámara, micrófono, altavoz, llamada al iPhone desde fuera de casa.
- Candidato de gama media: Reolink Video Doorbell WiFi. No incluye pantalla interior empotrable.
- **Pendiente:** verificar que pueda contestarse con audio bidireccional desde la pantalla de 10 pulgadas; visualizar RTSP/ONVIF no garantiza conversación. Considerar kits IP/SIP con monitor compatible.
- Otros candidatos revisados: Tapo D130 (económico) y Akuvox E12W (intercomunicador IP de gama más alta).
- Se acepta cierta dependencia de internet para el timbre, pero se prefiere operación local cuando sea posible.

## Etapa futura — Pantalla interior
- Pantalla de aproximadamente 10 pulgadas, empotrada al ras cerca de la puerta del departamento.
- Alimentación permanente y, si es viable, red cableada.
- Normalmente apagada o en reposo; despertar con llamada/eventos.
- Mostrar video, hablar con visitas, ver cámaras, controlar luces y cerradura desde Home Assistant.
- Seleccionar pantalla después de confirmar compatibilidad real con videoportero.

## Etapa futura — Cerraduras
- Cerradura inteligente para puerta del departamento: abrir desde iPhone, incluso fuera, y operar localmente sin internet con métodos alternativos (PIN/huella/llave según modelo).
- Apertura remota solo tras acción explícita del usuario, nunca automática por pulsar timbre.
- Apertura de puerta común del primer piso: **opcional**, sin costo ni equipamiento en etapa inicial; requiere evaluar chapa existente, autorización e integración.

## Próximos pasos
1. Contar interruptores y circuitos por ambiente.
2. Revisar neutro y medidas de cajas con electricista.
3. Comparar modelos táctiles Zigbee concretos (BSEED/MOES) y compatibilidad con escenas.
4. Comprar e instalar una unidad de prueba.
5. Definir coordinador Zigbee y configurar Home Assistant.
6. Después, retomar elección del videotimbre y pantalla.

## Decisiones que no deben perderse
- Prioridad: empezar por lo mínimo.
- Interruptores **táctiles**, no mecánicos.
- Zigbee y control local de iluminación.
- Sala: cuatro luces independientes, más control agrupado desde la entrada.
- Videotimbre después de los interruptores.
- Pantalla de 10 pulgadas y apertura de puerta común son fases posteriores (la última opcional).

const DEFAULT_PHYSICAL_CAPABILITIES = Object.freeze({
  movable: true,
  rotatable: true,
  resizable: true,
  copyable: true,
  deletable: true,
  layerable: true,
  lockable: true
});

function catalogItem(type, label, category, widthM, heightM, options = {}) {
  return Object.freeze({
    type,
    label,
    category,
    aliases: Object.freeze([...(options.aliases || [])]),
    eventTypes: options.eventTypes ? Object.freeze([...(options.eventTypes || [])]) : null,
    dimensions: Object.freeze({ widthM, heightM }),
    shape: options.shape || 'rect',
    spatialFamily: options.spatialFamily || 'obstacle',
    capabilities: options.capabilities || DEFAULT_PHYSICAL_CAPABILITIES,
    behavior: options.behavior || 'physical',
    icon: options.icon || '□',
    iconAsset: options.iconAsset || type,
    visual: Object.freeze({
      fit: options.visualFit || 'contain',
      paddingRatio: Math.max(0, Math.min(0.35, Number(options.visualPaddingRatio ?? 0.08))),
      anchor: options.visualAnchor || 'center'
    })
  });
}

const DISTRIBUTION_OBJECT_CATALOG = Object.freeze({
  dance: catalogItem('dance', 'Pista de baile', 'celebration', 5, 5, { spatialFamily: 'reserved', icon: '◇' }),
  couple: catalogItem('couple', 'Mesa de novios', 'furniture', 3, 1.2, { eventTypes: ['wedding'], icon: '♡' }),
  bar: catalogItem('bar', 'Barra', 'food-service', 4, 1.2, { icon: '▰' }),
  dj: catalogItem('dj', 'DJ / sonido', 'celebration', 3, 2, { icon: '♫' }),
  stage: catalogItem('stage', 'Escenario', 'venue', 4, 2.5, { icon: '▔' }),
  screen: catalogItem('screen', 'Pantalla / proyector', 'celebration', 2.5, 0.5, { icon: '▭' }),
  photo: catalogItem('photo', 'Photobooth / zona de fotos', 'celebration', 3, 2, { eventTypes: ['wedding', 'quince', 'birthday', 'graduation'], spatialFamily: 'reserved', icon: '⌾' }),
  booth360: catalogItem('booth360', 'Cabina 360°', 'celebration', 2.5, 2.5, { shape: 'circle', spatialFamily: 'reserved', icon: '◉' }),
  mirror: catalogItem('mirror', 'Espejo selfie', 'celebration', 1, 0.2, { icon: '│' }),
  altar: catalogItem('altar', 'Altar', 'decoration', 4, 2, { eventTypes: ['wedding', 'religious'], spatialFamily: 'reserved', icon: '⌂' }),
  arch: catalogItem('arch', 'Arco decorativo', 'decoration', 2.4, 0.8, { icon: '∩' }),
  backdrop: catalogItem('backdrop', 'Panel floral / backdrop', 'decoration', 2.5, 0.6, { icon: '▤' }),
  sign: catalogItem('sign', 'Tótem / letrero', 'decoration', 0.8, 0.5, { icon: '¶' }),
  divider: catalogItem('divider', 'Separador / biombo', 'decoration', 2, 0.4, { icon: '║' }),
  plantSmall: catalogItem('plantSmall', 'Planta pequeña', 'vegetation', 0.5, 0.5, { shape: 'sprite', icon: '♧', visualPaddingRatio: 0.04 }),
  plant: catalogItem('plant', 'Planta mediana', 'vegetation', 0.8, 0.8, { shape: 'sprite', icon: '♧', visualPaddingRatio: 0.05 }),
  tree: catalogItem('tree', 'Árbol / macetero grande', 'vegetation', 1.2, 1.2, { shape: 'sprite', icon: '♣', visualPaddingRatio: 0.04 }),
  planter: catalogItem('planter', 'Jardinera / macetero', 'vegetation', 1.5, 0.6, { shape: 'sprite', icon: '▰', visualPaddingRatio: 0.05 }),
  buffet: catalogItem('buffet', 'Buffet', 'food-service', 3, 0.9, { icon: '▤' }),
  drinks: catalogItem('drinks', 'Estación de bebidas', 'food-service', 2, 0.8, { icon: '◫' }),
  desserts: catalogItem('desserts', 'Estación de postres', 'food-service', 2.4, 0.8, { icon: '◇' }),
  cake: catalogItem('cake', 'Mesa de torta', 'furniture', 1.8, 1.8, { eventTypes: ['wedding', 'quince', 'birthday', 'baby_shower'], shape: 'circle', icon: '○' }),
  gifts: catalogItem('gifts', 'Mesa de regalos', 'furniture', 1.8, 0.75, { aliases: ['gift'], icon: '□' }),
  guestbook: catalogItem('guestbook', 'Mesa de firmas', 'furniture', 1.2, 0.6, { icon: '✎' }),
  welcome: catalogItem('welcome', 'Mesa de bienvenida', 'furniture', 1.8, 0.75, { icon: '▥' }),
  favors: catalogItem('favors', 'Mesa de recuerdos', 'furniture', 1.5, 0.7, { icon: '✧' }),
  cocktail: catalogItem('cocktail', 'Mesa alta / cóctel', 'furniture', 0.8, 0.8, { shape: 'circle', icon: '●' }),
  snacks: catalogItem('snacks', 'Carrito de snacks', 'food-service', 1.5, 0.8, { icon: '▧' }),
  supplier: catalogItem('supplier', 'Mesa de proveedores', 'furniture', 1.8, 0.75, { icon: '▦' }),
  entrance: catalogItem('entrance', 'Entrada / salida', 'venue', 2, 1.2, { spatialFamily: 'circulation', icon: '⇥' }),
  exit: catalogItem('exit', 'Salida', 'venue', 2, 1.2, { spatialFamily: 'circulation', icon: '⇤' }),
  restroom: catalogItem('restroom', 'Baños', 'venue', 2.5, 2, { icon: 'WC' }),
  kitchen: catalogItem('kitchen', 'Cocina / servicio', 'venue', 3, 2.5, { spatialFamily: 'restricted', icon: '⌑' }),
  technical: catalogItem('technical', 'Zona técnica', 'venue', 2, 1.5, { spatialFamily: 'restricted', icon: '⚙' }),
  column: catalogItem('column', 'Columna', 'venue', 0.5, 0.5, { icon: '■' }),
  extinguisher: catalogItem('extinguisher', 'Extintor / seguridad', 'safety-circulation', 0.5, 0.5, { icon: '!' }),
  chair: catalogItem('chair', 'Silla suelta', 'furniture', 0.5, 0.5, { behavior: 'detached-chair', icon: '▱' }),
  canopy: catalogItem('canopy', 'Cobertura rectangular / toldo modular', 'venue', 6, 6, { spatialFamily: 'container', behavior: 'physical-container', icon: '⌂' })
});

const SPECIALIZED_DISTRIBUTION_OBJECT_CATALOG = Object.freeze({
  quince_main_table: catalogItem('quince_main_table', 'Mesa principal de 15 años', 'furniture', 3, 1.2, {
    eventTypes: ['quince'],
    spatialFamily: 'obstacle',
    icon: '☆',
    iconAsset: 'couple'
  }),
  quince_choreography: catalogItem('quince_choreography', 'Zona de coreografía', 'celebration', 5, 5, {
    eventTypes: ['quince'],
    spatialFamily: 'reserved',
    icon: '◇',
    iconAsset: 'dance'
  }),
  baby_gifts: catalogItem('baby_gifts', 'Zona de regalos', 'furniture', 2.2, 1.2, {
    eventTypes: ['baby_shower'],
    spatialFamily: 'reserved',
    icon: '□',
    iconAsset: 'gifts'
  }),
  baby_games: catalogItem('baby_games', 'Zona de juegos', 'celebration', 4, 4, {
    eventTypes: ['baby_shower'],
    spatialFamily: 'reserved',
    icon: '☆',
    iconAsset: 'dance'
  }),
  graduation_diplomas: catalogItem('graduation_diplomas', 'Mesa de diplomas', 'furniture', 2.4, 0.9, {
    eventTypes: ['graduation'],
    spatialFamily: 'obstacle',
    icon: '▤',
    iconAsset: 'guestbook'
  }),
  graduation_stage: catalogItem('graduation_stage', 'Escenario de graduación', 'venue', 5, 3, {
    eventTypes: ['graduation'],
    spatialFamily: 'reserved',
    icon: '▔',
    iconAsset: 'stage'
  })
});

const DRAWABLE_AREA_PRESETS = Object.freeze({
  tent: Object.freeze({ areaKind: 'tent', label: 'Toldo', icon: '⌂', color: '#d8c9a6', transparency: 45, dimensions: Object.freeze({ widthM: 5, heightM: 4 }), spatialFamily: 'container' }),
  stage: Object.freeze({ areaKind: 'stage', label: 'Área de escenario', icon: '▔', color: '#c8b7ad', transparency: 45, dimensions: Object.freeze({ widthM: 5, heightM: 3 }), spatialFamily: 'reserved' }),
  lounge: Object.freeze({ areaKind: 'lounge', label: 'Área lounge', icon: '◫', color: '#c9c2d8', transparency: 45, dimensions: Object.freeze({ widthM: 4, heightM: 4 }), spatialFamily: 'reserved' }),
  children: Object.freeze({ areaKind: 'children', label: 'Área infantil', icon: '☆', color: '#d9c9b8', transparency: 45, dimensions: Object.freeze({ widthM: 4, heightM: 4 }), spatialFamily: 'reserved' }),
  buffet: Object.freeze({ areaKind: 'buffet', label: 'Área de buffet', icon: '▤', color: '#c8d5bd', transparency: 45, dimensions: Object.freeze({ widthM: 4, heightM: 2 }), spatialFamily: 'reserved' }),
  technical: Object.freeze({ areaKind: 'technical', label: 'Zona técnica', icon: '⚙', color: '#c2c7c8', transparency: 45, dimensions: Object.freeze({ widthM: 3, heightM: 2 }), spatialFamily: 'restricted' }),
  restricted: Object.freeze({ areaKind: 'restricted', label: 'Zona restringida', icon: '⊘', color: '#d5bdb8', transparency: 45, dimensions: Object.freeze({ widthM: 3, heightM: 3 }), spatialFamily: 'restricted' }),
  circulation: Object.freeze({ areaKind: 'circulation', label: 'Circulación', icon: '↔', color: '#bdced3', transparency: 45, dimensions: Object.freeze({ widthM: 4, heightM: 1.2 }), spatialFamily: 'circulation' }),
  custom: Object.freeze({ areaKind: 'custom', label: 'Área personalizada', icon: '▧', color: '#c8ccb9', transparency: 45, dimensions: Object.freeze({ widthM: 4, heightM: 3 }), spatialFamily: 'informative' })
});

const DRAWABLE_AREA_ORDER = Object.freeze([
  'tent', 'stage', 'lounge', 'children', 'buffet', 'technical', 'restricted', 'circulation', 'custom'
]);

const DRAWABLE_AREA_CATALOG = Object.freeze(Object.fromEntries(
  DRAWABLE_AREA_ORDER.map((areaKind) => {
    const preset = DRAWABLE_AREA_PRESETS[areaKind];
    return [areaKind, catalogItem('area', preset.label, 'drawn-areas', preset.dimensions.widthM, preset.dimensions.heightM, {
      spatialFamily: preset.spatialFamily,
      behavior: 'polygon-area',
      icon: preset.icon
    })];
  })
));

const LEGACY_AREA_CATALOG = Object.freeze({
  circulation: catalogItem('circulation', 'Circulación', 'drawn-areas', 4, 1.2, { spatialFamily: 'circulation', behavior: 'legacy-area', icon: '↔' }),
  restricted: catalogItem('restricted', 'Zona restringida', 'drawn-areas', 3, 3, { spatialFamily: 'restricted', behavior: 'legacy-area', icon: '⊘' }),
  zone: catalogItem('zone', 'Zona / área', 'drawn-areas', 4, 3, { spatialFamily: 'informative', behavior: 'legacy-area', icon: '▧' })
});

if (Object.keys(DISTRIBUTION_OBJECT_CATALOG).length !== 38) {
  throw new Error('El catálogo ordinario de Distribución debe contener exactamente 38 objetos.');
}

const CATALOG_CATEGORY_PRESENTATION = Object.freeze([
  Object.freeze({ id: 'furniture', label: 'Mesas y mobiliario' }),
  Object.freeze({ id: 'food-service', label: 'Comida y atención' }),
  Object.freeze({ id: 'celebration', label: 'Celebración y experiencias' }),
  Object.freeze({ id: 'decoration', label: 'Decoración' }),
  Object.freeze({ id: 'venue', label: 'Infraestructura / recinto' }),
  Object.freeze({ id: 'vegetation', label: 'Vegetación' }),
  Object.freeze({ id: 'safety-circulation', label: 'Seguridad / circulación' })
]);

const CATALOG_OBJECT_ORDER = Object.freeze([
  'couple', 'cake', 'gifts', 'guestbook', 'welcome', 'favors', 'cocktail', 'supplier',
  'bar', 'buffet', 'drinks', 'desserts', 'snacks',
  'dance', 'dj', 'screen', 'photo', 'booth360', 'mirror',
  'altar', 'arch', 'backdrop', 'sign', 'divider',
  'stage', 'canopy', 'entrance', 'exit', 'restroom', 'kitchen', 'technical', 'column',
  'plantSmall', 'plant', 'tree', 'planter',
  'extinguisher'
]);

function normalizeCatalogEventType(eventType) {
  const value = String(eventType || '').trim().toLowerCase();
  return value || 'wedding';
}

function catalogItemSupportsEvent(item, eventType) {
  if (!item) return false;
  if (!item.eventTypes || !item.eventTypes.length) return true;
  return item.eventTypes.includes(normalizeCatalogEventType(eventType));
}

function getVisibleCatalogGroups(eventType = 'wedding') {
  const visible = [
    ...CATALOG_OBJECT_ORDER.map((type) => DISTRIBUTION_OBJECT_CATALOG[type]),
    ...Object.values(SPECIALIZED_DISTRIBUTION_OBJECT_CATALOG)
  ].filter((item) => catalogItemSupportsEvent(item, eventType));
  return CATALOG_CATEGORY_PRESENTATION.map((category) => Object.freeze({
    ...category,
    items: Object.freeze(visible.filter((item) => item.category === category.id))
  })).filter((group) => group.items.length);
}

const TYPE_ALIASES = Object.freeze(Object.fromEntries(
  Object.values(DISTRIBUTION_OBJECT_CATALOG)
    .flatMap((item) => item.aliases.map((alias) => [alias, item.type]))
));

function resolveCatalogType(type) {
  const value = String(type || '').trim();
  return TYPE_ALIASES[value] || value;
}

function getAreaPreset(areaKind) {
  return DRAWABLE_AREA_PRESETS[String(areaKind || '').trim()] || null;
}

function getVisibleAreaPresets() {
  return DRAWABLE_AREA_ORDER.map((areaKind) => DRAWABLE_AREA_PRESETS[areaKind]).filter(Boolean);
}

function getAreaCatalogItem(areaKind) {
  return DRAWABLE_AREA_CATALOG[String(areaKind || '').trim()] || null;
}

function getElementCatalogItem(element) {
  if (element?.type === 'area') return getAreaCatalogItem(element.areaKind);
  return getCatalogItem(element?.type);
}

function getCatalogItem(type) {
  const resolved = resolveCatalogType(type);
  return DISTRIBUTION_OBJECT_CATALOG[resolved] || SPECIALIZED_DISTRIBUTION_OBJECT_CATALOG[resolved] || LEGACY_AREA_CATALOG[resolved] || null;
}

export {
  DISTRIBUTION_OBJECT_CATALOG,
  SPECIALIZED_DISTRIBUTION_OBJECT_CATALOG,
  LEGACY_AREA_CATALOG,
  DRAWABLE_AREA_CATALOG,
  DRAWABLE_AREA_PRESETS,
  DRAWABLE_AREA_ORDER,
  getVisibleCatalogGroups,
  catalogItemSupportsEvent,
  getVisibleAreaPresets,
  getAreaPreset,
  getAreaCatalogItem,
  getElementCatalogItem,
  getCatalogItem,
  resolveCatalogType
};

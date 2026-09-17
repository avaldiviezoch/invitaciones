/* Distribución · fachada de exportación memory-only.
   No crea persistencia ni toca App Mi Lu. */
(() => {
  'use strict';
  function snapshot(){
    return typeof stateSnapshot === 'function' ? structuredClone(stateSnapshot()) : {};
  }
  window.MiGranDiaDistributionExport = Object.freeze({
    snapshot,
    json(){ return JSON.stringify(snapshot(), null, 2); },
    storageWrites:false
  });
})();

// Exportación XLSX autocontenida. Sin CDN, sin lecturas de red, sin Firebase.
// Datos como inlineStr: evita ejecutar fórmulas suministradas por invitados.
const xml = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
const encoder = new TextEncoder();
function checksum(bytes) {
  let value = -1;
  for (const byte of bytes) {
    value ^= byte;
    for (let i = 0; i < 8; i++) value = (value >>> 1) ^ (value & 1 ? 0xEDB88320 : 0);
  }
  return (value ^ -1) >>> 0;
}
function zip(entries) {
  const local = [], central = [];
  let offset = 0;
  for (const [name, content] of entries) {
    const filename = encoder.encode(name), data = encoder.encode(content), crc = checksum(data);
    const header = new Uint8Array(30 + filename.length);
    const h = new DataView(header.buffer);
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0,true);
    h.setUint16(8,0,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);
    h.setUint32(22,data.length,true);h.setUint16(26,filename.length,true);header.set(filename,30);
    local.push(header,data);
    const record = new Uint8Array(46 + filename.length), v = new DataView(record.buffer);
    v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);
    v.setUint32(16,crc,true);v.setUint32(20,data.length,true);v.setUint32(24,data.length,true);
    v.setUint16(28,filename.length,true);v.setUint32(42,offset,true);record.set(filename,46);
    central.push(record);offset += header.length + data.length;
  }
  const centralSize=central.reduce((n,p)=>n+p.length,0);
  const end=new Uint8Array(22), view=new DataView(end.buffer);
  view.setUint32(0,0x06054b50,true);view.setUint16(8,entries.length,true);
  view.setUint16(10,entries.length,true);view.setUint32(12,centralSize,true);
  view.setUint32(16,offset,true);
  return new Blob([...local,...central,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
function column(index) {
  let label = '';
  for (let n=index+1;n>0;n=Math.floor((n-1)/26)) label=String.fromCharCode(65+(n-1)%26)+label;
  return label;
}
function buildXlsx({title='Reporte Migrandia',columns=[],rows=[]}={}) {
  if (!Array.isArray(columns) || !columns.length || columns.length>40) throw new Error('Columnas inválidas.');
  if (!Array.isArray(rows) || rows.length>25000) throw new Error('Reporte demasiado grande.');
  const values=[columns,...rows.map(row=>columns.map((_,i)=>row?.[i]??''))];
  const maxCol=column(columns.length-1);
  const cells=values.map((row,i)=>'<row r="'+(i+1)+'" ht="'+(i===0?30:24)+'" customHeight="1">'+
    row.map((value,j)=>{
      const ref=column(j)+(i+1),style=i===0?1:i%2===0?2:0;
      return '<c r="'+ref+'" s="'+style+'" t="inlineStr"><is><t xml:space="preserve">'+xml(value)+'</t></is></c>';
    }).join('')+'</row>').join('');
  const widths=columns.map((heading,i)=>{
    const longest=Math.max(String(heading).length,...rows.slice(0,250).map(row=>String(row?.[i]??'').length));
    return '<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+Math.max(15,Math.min(44,longest+5))+'" customWidth="1"/>';
  }).join('');
  const brandRow='<row r="'+(values.length+2)+'"><c r="A'+(values.length+2)+'" s="3" t="inlineStr"><is><t>migrandia.com</t></is></c></row>';
  const sheet='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    +'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    +'<sheetViews><sheetView showGridLines="0" workbookViewId="0"/></sheetViews><cols>'+widths+'</cols>'
    +'<sheetData>'+cells+brandRow+'</sheetData><autoFilter ref="A1:'+maxCol+values.length+'"/>'
    +'<pageMargins left=".35" right=".35" top=".5" bottom=".5" header=".2" footer=".2"/></worksheet>';
  const styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    +'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    +'<fonts count="3"><font><sz val="11"/><name val="Aptos"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Aptos"/></font><font><sz val="9"/><color rgb="FF75836D"/><name val="Aptos"/></font></fonts>'
    +'<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'
    +'<fill><patternFill patternType="solid"><fgColor rgb="FF243B53"/><bgColor indexed="64"/></patternFill></fill>'
    +'<fill><patternFill patternType="solid"><fgColor rgb="FFEAF2F4"/><bgColor indexed="64"/></patternFill></fill></fills>'
    +'<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
    +'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
    +'<cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
    +'<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>'
    +'<xf numFmtId="0" fontId="0" fillId="3" borderId="0" xfId="0" applyFill="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>'
    +'<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  const workbook='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    +'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
    +'<sheets><sheet name="'+xml(String(title).slice(0,31))+'" sheetId="1" r:id="rId1"/></sheets></workbook>';
  return zip([
    ['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      +'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      +'<Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
      +'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
      +'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
    ['_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      +'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml',workbook],
    ['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      +'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
      +'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
    ['xl/styles.xml',styles],['xl/worksheets/sheet1.xml',sheet]
  ]);
}
function downloadXlsx(options,filename='migrandia-reporte.xlsx') {
  const url=URL.createObjectURL(buildXlsx(options));
  const link=document.createElement('a');link.href=url;link.download=filename;link.click();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export { buildXlsx,downloadXlsx };

// Paquete offline, sin Firebase/CDN: borrador editable y vista HTML juntos.
// ZIP store (sin compresión) con CRC32 y nombre seguro.
const encoder=new TextEncoder();
function crc32(bytes){let crc=-1;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xEDB88320:0);}return (crc^-1)>>>0;}
function makeInvitationPackage({draft,html}){
  if(!draft||typeof draft!=='object'||typeof html!=='string'||!html.startsWith('<!doctype html'))throw new Error('Datos del paquete inválidos.');
  const entries=[['borrador-editable.json',JSON.stringify(draft,null,2)],['vista-previa.html',html]];
  const local=[],central=[];let offset=0;
  for(const [name,content] of entries){
    const file=encoder.encode(name),data=encoder.encode(content),crc=crc32(data);
    const lh=new Uint8Array(30+file.length),h=new DataView(lh.buffer);
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(14,crc&65535,true);
    h.setUint16(16,crc>>>16,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,file.length,true);lh.set(file,30);
    local.push(lh,data);
    const cd=new Uint8Array(46+file.length),v=new DataView(cd.buffer);
    v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);v.setUint32(16,crc,true);
    v.setUint32(20,data.length,true);v.setUint32(24,data.length,true);v.setUint16(28,file.length,true);v.setUint32(42,offset,true);cd.set(file,46);
    central.push(cd);offset+=lh.length+data.length;
  }
  const dirSize=central.reduce((n,p)=>n+p.length,0),end=new Uint8Array(22),e=new DataView(end.buffer);
  e.setUint32(0,0x06054b50,true);e.setUint16(8,entries.length,true);e.setUint16(10,entries.length,true);e.setUint32(12,dirSize,true);e.setUint32(16,offset,true);
  return new Blob([...local,...central,end],{type:'application/zip'});
}
export {makeInvitationPackage};

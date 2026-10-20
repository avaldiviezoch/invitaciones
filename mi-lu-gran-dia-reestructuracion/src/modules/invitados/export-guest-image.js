// Láminas PNG para invitados: se generan en memoria, sin fuentes o imágenes externas.
const label=(value,max=48)=>String(value??'').trim().slice(0,max);
const colors={ink:'#22354B',muted:'#64748B',paper:'#FAFBFD',navy:'#243B53',mint:'#DCEFEB',line:'#DAE3EC'};
function createGuestImagePages({eventName='Evento',guests=[],tables=[],statusLabel=String}={}) {
  if(typeof document==='undefined') throw new Error('Se requiere navegador para generar imágenes.');
  const assigned = new Map(tables.map(t=>[String(t.id),label(t.name||'Mesa')]));
  const perPage=25,pages=[];
  const total=Math.max(1,Math.ceil(guests.length/perPage));
  for(let page=0;page<total;page++){
    const subset=guests.slice(page*perPage,(page+1)*perPage);
    const canvas=document.createElement('canvas');
    const width=1400,rowHeight=72;
    canvas.width=width;canvas.height=400+Math.max(1,subset.length)*rowHeight+130;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle=colors.paper;ctx.fillRect(0,0,width,canvas.height);
    ctx.fillStyle=colors.navy;ctx.fillRect(0,0,width,210);
    ctx.fillStyle='#BDE7D8';ctx.font='bold 24px Arial';ctx.fillText('LISTA DE INVITADOS',70,78);
    ctx.fillStyle='white';ctx.font='bold 48px Georgia';ctx.fillText(label(eventName,45),70,143);
    ctx.font='24px Arial';ctx.fillText('Total '+guests.length+' invitados',70,182);
    ctx.fillStyle=colors.muted;ctx.font='22px Arial';ctx.fillText('N.°',70,305);
    ctx.fillText('INVITADO',140,305);ctx.fillText('ESTADO',790,305);ctx.fillText('MESA',1090,305);
    subset.forEach((guest,i)=>{
      const y=340+i*rowHeight;
      ctx.fillStyle=i%2?'#FFFFFF':'#EFF5F8';ctx.fillRect(60,y,width-120,rowHeight-4);
      ctx.font='22px Arial';ctx.fillStyle=colors.muted;ctx.fillText(String(page*perPage+i+1).padStart(2,'0'),73,y+44);
      ctx.font='bold 23px Arial';ctx.fillStyle=colors.ink;ctx.fillText(label(guest.name||'Invitado sin nombre',42),140,y+44);
      const status=label(statusLabel(guest.status),22);
      ctx.fillStyle=guest.status==='confirmed'?'#176A59':guest.status==='declined'?'#A33E48':'#805D1F';
      ctx.font='bold 21px Arial';ctx.fillText(status,790,y+44);
      ctx.fillStyle=colors.ink;ctx.font='21px Arial';
      ctx.fillText(label(assigned.get(String(guest.tableId))||'Sin mesa',18),1090,y+44);
    });
    ctx.fillStyle=colors.line;ctx.fillRect(65,canvas.height-95,width-130,2);
    ctx.fillStyle=colors.muted;ctx.font='20px Arial';ctx.fillText('migrandia.com · Documento privado',70,canvas.height-55);
    ctx.fillText('Página '+(page+1)+' de '+total,1160,canvas.height-55);
    pages.push(canvas);
  }
  return pages;
}
async function downloadGuestImages(options) {
  const canvases=createGuestImagePages(options);
  for(let i=0;i<canvases.length;i++){
    const canvas=canvases[i];
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if(!blob)throw new Error('No se pudo preparar la imagen.');
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='migrandia-invitados-'+String(i+1).padStart(2,'0')+'.png';a.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),2000);
  }
}
export { createGuestImagePages,downloadGuestImages };

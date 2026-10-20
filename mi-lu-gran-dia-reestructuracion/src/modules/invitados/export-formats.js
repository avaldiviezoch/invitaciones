// Exportaciones adicionales desde datos ya cargados: sin red ni persistencia.
const safe=s=>String(s??'').slice(0,140);
function renderReportPages({title,columns,rows,eventName='Evento'}){
  const perPage=24,pages=[];
  for(let p=0;p<Math.max(1,Math.ceil(rows.length/perPage));p++){
    const cv=document.createElement('canvas');cv.width=1400;cv.height=2050;
    const c=cv.getContext('2d');c.fillStyle='#F9FAF8';c.fillRect(0,0,1400,2050);
    c.fillStyle='#465D46';c.fillRect(0,0,1400,215);c.fillStyle='#E5EEDF';c.font='bold 24px Arial';
    c.fillText('REPORTE DEL EVENTO',65,67);c.fillStyle='#fff';c.font='bold 44px Georgia';
    c.fillText(safe(title),65,135);c.font='24px Arial';c.fillText(safe(eventName),65,182);
    const widths=columns.map((_,i)=>i===0?470:(1250-470)/(columns.length-1||1));
    const x=[65];for(let i=1;i<columns.length;i++)x.push(x[i-1]+widths[i-1]);
    c.fillStyle='#56674E';c.font='bold 22px Arial';
    columns.forEach((col,i)=>c.fillText(safe(col).slice(0,i===0?31:21),x[i],280));
    rows.slice(p*perPage,(p+1)*perPage).forEach((row,index)=>{
      const yy=312+index*66;c.fillStyle=index%2?'#fff':'#EBF1E9';c.fillRect(55,yy,1290,62);
      c.fillStyle='#334536';c.font='21px Arial';
      columns.forEach((_,i)=>c.fillText(safe(row[i]).slice(0,i===0?31:17),x[i],yy+39));
    });
    c.fillStyle='#718075';c.font='21px Arial';
    c.fillText('migrandia.com · Organización del evento',65,1988);
    c.fillText('Página '+(p+1)+' / '+Math.max(1,Math.ceil(rows.length/perPage)),1150,1988);
    pages.push(cv);
  }
  return pages;
}
async function downloadCanvasPages(pages,prefix){
  for(let i=0;i<pages.length;i++){
    const blob=await new Promise(done=>pages[i].toBlob(done,'image/png'));
    if(!blob)throw new Error('No fue posible crear la imagen.');
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=prefix+'-'+String(i+1).padStart(2,'0')+'.png';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
  }
}
function printCanvasPages(pages,title='Migrandia'){
  // El usuario elige «Guardar como PDF» desde el diálogo de impresión.
  const win=window.open('','_blank');
  if(!win)throw new Error('Permite la ventana de impresión para guardar como PDF.');
  const pictures=pages.map(p=>'<img alt="Página exportable" src="'+p.toDataURL('image/png')+'">').join('');
  win.document.open();win.document.write('<!doctype html><html lang="es"><head><meta charset="utf-8"><title>'+safe(title).replaceAll('&','&amp;').replaceAll('<','&lt;')+'</title><style>@page{size:A4 portrait;margin:0}body{margin:0;background:#fff}img{display:block;width:210mm;height:297mm;object-fit:contain;break-after:page}img:last-child{break-after:auto}@media screen{img{max-width:800px;height:auto;margin:10px auto}}</style></head><body>'+pictures+'</body></html>');win.document.close();
  win.addEventListener('load',()=>win.print(),{once:true});
}
export { renderReportPages,downloadCanvasPages,printCanvasPages };

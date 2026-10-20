// Cuatro mesas por lámina A4 vertical (PNG), sin datos enviados a terceros.
const themes=[
  {accent:'#235970',soft:'#DDEBF2'},{accent:'#257267',soft:'#E1F2EC'},
  {accent:'#99543E',soft:'#F8EBE4'},{accent:'#695B9A',soft:'#EEEAF7'}
];
const clip=(s,n=36)=>String(s??'').trim().slice(0,n);
function drawRounded(ctx,x,y,w,h,r,fill) {
  ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();
}
function renderTablesPages({eventName='Evento',tables=[],guests=[]}={}) {
  if (typeof document==='undefined') throw new Error('Solo disponible en el navegador.');
  const pages=[];
  const total=Math.max(1,Math.ceil(tables.length/4));
  for (let page=0;page<total;page++) {
    const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=2250;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#F5F8FB';ctx.fillRect(0,0,1600,2250);
    ctx.fillStyle='#243B53';ctx.fillRect(0,0,1600,240);
    ctx.fillStyle='#B3E5D8';ctx.font='bold 24px Arial';ctx.fillText('MESAS Y ASIENTOS',82,73);
    ctx.fillStyle='#FFFFFF';ctx.font='bold 48px Georgia';ctx.fillText(clip(eventName,45),82,146);
    ctx.font='24px Arial';ctx.fillText(tables.length+' mesas  ·  '+guests.filter(g=>g.tableId).length+' invitados asignados',82,196);
    tables.slice(page*4,page*4+4).forEach((table,index)=>{
      const t=themes[(page*4+index)%themes.length],col=index%2,row=Math.floor(index/2);
      const x=70+col*755,y=300+row*905,w=720,h=850;
      drawRounded(ctx,x,y,w,h,27,'#FFFFFF');
      drawRounded(ctx,x,y,w,95,27,t.accent);ctx.fillRect(x,y+53,w,42);
      ctx.fillStyle='#FFFFFF';ctx.font='bold 34px Georgia';
      ctx.fillText(clip(table.name||('Mesa '+(page*4+index+1)),30),x+32,y+61);
      const members=guests.filter(g=>String(g.tableId||'')===String(table.id));
      const capacity=Number(table.capacity)|| (Array.isArray(table.seats)?table.seats.length:0);
      ctx.fillStyle=t.accent;ctx.font='bold 22px Arial';ctx.fillText('OCUPACIÓN  '+members.length+' / '+capacity,x+30,y+142);
      // Mesa representativa y sillas decorativas: ocupación factual en lista inferior.
      const cx=x+w/2,cy=y+315;
      ctx.fillStyle=t.soft;ctx.beginPath();ctx.ellipse(cx,cy,137,102,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=t.accent;ctx.lineWidth=4;ctx.stroke();
      ctx.font='bold 24px Arial';ctx.fillStyle=t.accent;ctx.textAlign='center';
      ctx.fillText('MESA',cx,cy+9);ctx.textAlign='start';
      const seats=Math.max(0,Math.min(capacity,16));
      for(let i=0;i<seats;i++){
        const angle=2*Math.PI*i/Math.max(1,seats)-Math.PI/2;
        const sx=cx+190*Math.cos(angle),sy=cy+154*Math.sin(angle);
        const occupied=members.some(g=>Number(g.seatNumber)===i+1);
        ctx.fillStyle=occupied?t.accent:'#FFFFFF';ctx.strokeStyle=t.accent;ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(sx,sy,22,0,Math.PI*2);ctx.fill();ctx.stroke();
        ctx.font='bold 15px Arial';ctx.fillStyle=occupied?'#FFFFFF':t.accent;
        ctx.textAlign='center';ctx.fillText(String(i+1),sx,sy+5);ctx.textAlign='start';
      }
      ctx.fillStyle='#233548';ctx.font='bold 22px Arial';ctx.fillText('ASIGNACIÓN DE ASIENTOS',x+32,y+527);
      ctx.fillStyle='#D5DEE8';ctx.fillRect(x+32,y+544,w-64,2);
      const sorted=[...members].sort((a,b)=>(Number(a.seatNumber)||999)-(Number(b.seatNumber)||999));
      sorted.slice(0,16).forEach((g,i)=>{
        const line=i%8,side=Math.floor(i/8),xx=x+32+side*330,yy=y+586+line*30;
        ctx.fillStyle=i%2?'#4C6477':'#273E52';ctx.font='17px Arial';
        const seat=Number(g.seatNumber)>0?'S'+g.seatNumber:'S—';
        ctx.fillText(seat+'  '+clip(g.name||'Invitado',24),xx,yy);
      });
      if(sorted.length>16){ctx.fillStyle=t.accent;ctx.font='bold 16px Arial';ctx.fillText('+'+(sorted.length-16)+' adicionales',x+32,y+823);}
      if(!sorted.length){ctx.fillStyle='#708090';ctx.font='italic 20px Arial';ctx.fillText('Sin invitados asignados',x+32,y+608);}
    });
    ctx.fillStyle='#D7E0E8';ctx.fillRect(75,2165,1450,2);
    ctx.fillStyle='#64748B';ctx.font='22px Arial';
    ctx.fillText('migrandia.com · Distribución para organización',82,2209);
    ctx.textAlign='right';ctx.fillText('Hoja '+(page+1)+' / '+total,1512,2209);ctx.textAlign='start';
    pages.push(canvas);
  }
  return pages;
}
async function downloadTablesPages(options) {
  const pages=renderTablesPages(options);
  for(let i=0;i<pages.length;i++) {
    const blob=await new Promise(resolve=>pages[i].toBlob(resolve,'image/png'));
    if(!blob) throw new Error('No se pudo generar la imagen de mesas.');
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='migrandia-mesas-hoja-'+String(i+1).padStart(2,'0')+'.png';
    a.click();window.setTimeout(()=>URL.revokeObjectURL(url),2500);
  }
}
export { renderTablesPages,downloadTablesPages };

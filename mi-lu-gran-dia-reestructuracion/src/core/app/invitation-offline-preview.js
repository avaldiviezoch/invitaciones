import { normalizeDraftInput } from './invitation-draft-contract.js';
import { getInvitationCopy } from './invitation-copy.js';

const escapeText = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const THEMES = Object.freeze({
  ivory: ['#f4eadc','#384537','#b9a98c'], sage: ['#e6ece1','#2f493d','#9cb09d'],
  rose: ['#f5e6e7','#5a3941','#c9a6ad'], navy: ['#e7ebf1','#25364f','#8798b0']
});
const AUTO = Object.freeze({ wedding:'ivory',birthday:'rose',quince:'rose',baby_shower:'sage',
  religious:'ivory',graduation:'navy',corporate:'navy',custom:'sage' });

function renderOfflineInvitationDraft(input) {
  const draft = normalizeDraftInput(input);
  const [background, ink, accent] = THEMES[draft.colorPalette === 'auto' ? AUTO[draft.eventType] : draft.colorPalette];
  const copy = getInvitationCopy(draft.eventType);
  const font = draft.fontStyle === 'sans' ? 'Arial, Helvetica, sans-serif' : 'Georgia, Times New Roman, serif';
  const title = escapeText(draft.eventName || copy.heading);
  const message = escapeText(draft.message || copy.greeting);
  const guest = draft.guestName ? '<p>Para ' + escapeText(draft.guestName) + '</p>' : '';
  const date = escapeText(draft.date || 'Fecha por definir');
  const place = escapeText(draft.location || 'Lugar por definir');
  const minimal = draft.templateId === 'minimal-black';
  const themed = draft.templateId === 'one-piece-elegant';
  const border = minimal ? '0' : '1px solid ' + accent;
  const decoration = themed ? '<div class="theme-mark" aria-hidden="true">✦</div>' : '';
  const layoutClass = minimal ? 'minimal' : themed ? 'themed' : 'classic';
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Borrador de invitación - ${title}</title>
<style>*,*::before,*::after{box-sizing:border-box}body{margin:0;min-height:100vh;background:${background};color:${ink};font-family:${font};display:grid;place-items:center;padding:26px}.invitation{width:min(100%,650px);padding:clamp(32px,7vw,78px) 24px;text-align:center;border:${border};background:rgba(255,255,255,.42);overflow-wrap:anywhere}.eyebrow{font:600 11px Arial,sans-serif;letter-spacing:.24em;text-transform:uppercase;color:${ink}}h1{font-size:clamp(28px,7vw,56px);font-weight:400;line-height:1.15}.rule{width:70px;height:1px;background:${accent};margin:32px auto}p{font-size:clamp(16px,3vw,20px);line-height:1.7}small{display:block;margin-top:36px;font:600 10px Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:${ink}}.invitation.minimal{background:transparent;box-shadow:none}.invitation.minimal h1{font-family:Arial,Helvetica,sans-serif;font-weight:700;letter-spacing:-.035em;text-transform:uppercase}.invitation.minimal .rule{width:110px;height:3px;background:currentColor}.invitation.themed{border-width:2px;border-radius:140px 140px 16px 16px;box-shadow:inset 0 0 0 9px rgba(255,255,255,.35)}.invitation.themed h1{font-style:italic;letter-spacing:.015em}.theme-mark{font-size:40px;line-height:1;color:${accent};margin:0 auto 14px}.print-control{position:fixed;top:18px;right:18px;padding:12px 18px;border:1px solid currentColor;border-radius:8px;background:white;color:#18231c;font:600 14px Arial,sans-serif;cursor:pointer}.print-control:focus-visible{outline:3px solid #247a53;outline-offset:2px}@page{size:A4;margin:12mm}@media print{body{padding:0;min-height:auto;-webkit-print-color-adjust:exact;print-color-adjust:exact}.invitation{border:0;break-inside:avoid}.print-control{display:none}}</style>
</head><body><button class="print-control" type="button" onclick="window.print()" aria-label="Imprimir o guardar como PDF">Imprimir / Guardar PDF</button><main class="invitation ${layoutClass}">${decoration}<div class="eyebrow">Vista previa local</div><h1>${title}</h1><div class="rule"></div>
<p>${message}</p>${guest}<p>${escapeText(copy.dateLabel)} ${date}</p><p>${place}</p>
<small>Borrador sin publicar · No habilita RSVP</small></main></body></html>`;
}
export { renderOfflineInvitationDraft };

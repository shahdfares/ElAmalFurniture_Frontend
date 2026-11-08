import { Product } from 'shared';

export function printProductSheet(p: Product): void {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(buildSheetHtml(p));
  doc.close();

  const imagesReady = Array.from(doc.images).map((img) =>
    img.complete
      ? Promise.resolve()
      : new Promise((res) => { img.onload = img.onerror = () => res(null); })
  );
  const fontsReady = Promise.race([
    (doc as any).fonts?.ready ?? Promise.resolve(),
    new Promise((res) => setTimeout(res, 1500)),
  ]);

  Promise.all([...imagesReady, fontsReady]).then(() => {
    const win = iframe.contentWindow!;
    win.onafterprint = () => iframe.remove();
    win.focus();
    win.print();
  });
}

function esc(v: any): string {
  return String(v ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)
  );
}

function buildSheetHtml(p: Product): string {
  const imgs = [...p.productImages].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  const hero = imgs[0];
  const rest = imgs.slice(1);

  const specs = p.technicalSpecification
    .map((s) => `<div class="spec"><div class="spec__k">${esc(s.name)}</div><div class="spec__v">${esc(s.value)}</div></div>`)
    .join('');

  const gallery = rest
    .map((i, idx) => `<figure><img src="${esc(i.imagesUrl)}" alt=""><figcaption>${String(idx + 2).padStart(2, '0')}</figcaption></figure>`)
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8">
  <title>${esc(p.name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400&family=Plus+Jakarta+Sans:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      background: #FBF9F5;
      color: #1B1C1A;
      font-family: 'Plus Jakarta Sans', Arial, sans-serif;
      font-weight: 300;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .caps {
      font-size: 7.5px;
      letter-spacing: .14em;
      text-transform: uppercase;
      color: #6E6A64;
    }
    .top {
      display: flex;
      justify-content: space-between;
      padding-bottom: 3mm;
      border-bottom: 1px solid #E2DFD9;
    }
    .main {
      display: grid;
      grid-template-columns: 96mm 1fr;
      gap: 10mm;
      margin-top: 10mm;
      align-items: start;
    }
    .hero { position: relative; height: 112mm; background: #EFEEEA; }
    .hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .hero__cap {
      position: absolute;
      left: 3mm;
      bottom: 3mm;
      max-width: calc(100% - 6mm);
      padding: 1.6mm 3mm;
      background: #2C2825;
      color: #fff;
      font-size: 6.5px;
      letter-spacing: .14em;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    h1 {
      margin: 2mm 0 2mm;
      font-family: 'Playfair Display', Georgia, serif;
      font-weight: 400;
      font-size: 30px;
      line-height: 1.1;
      overflow-wrap: anywhere;
    }
    .ref { margin-bottom: 5mm; }
    .desc { margin: 0 0 7mm; font-size: 10.5px; line-height: 1.75; color: #6E6A64; }
    .specs { border-top: 1px solid #E2DFD9; }
    .specs__head { padding: 3mm 0; border-bottom: 1px solid #E2DFD9; }
    .spec {
      display: grid;
      grid-template-columns: 26mm 1fr;
      gap: 3mm;
      padding: 3.6mm 0;
      border-bottom: 1px solid #E2DFD9;
      break-inside: avoid;
    }
    .spec__k { font-size: 7.5px; letter-spacing: .12em; text-transform: uppercase; color: #6E6A64; padding-top: 1px; }
    .spec__v { font-size: 11px; line-height: 1.5; color: #1B1C1A; }
    .gallery { margin-top: 12mm; }
    .gallery__head { padding-bottom: 3mm; border-bottom: 1px solid #E2DFD9; margin-bottom: 6mm; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6mm; }
    figure { margin: 0; break-inside: avoid; }
    figure img { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; background: #EFEEEA; }
    figcaption { margin-top: 1.5mm; font-size: 7.5px; letter-spacing: .12em; color: #6E6A64; }
  </style></head><body>

  <div class="top caps">
    <span>${esc(p.category)}</span>
    ${p.code ? `<span>Ref. ${esc(p.code)}</span>` : ''}
  </div>

  <div class="main">
    <div class="hero">
      ${hero ? `<img src="${esc(hero.imagesUrl)}" alt="">` : ''}
      <div class="hero__cap">Plate 01 — ${esc(p.name)}</div>
    </div>

    <div>
      <h1>${esc(p.name)}</h1>
      ${p.code ? `<div class="ref caps">Ref. ${esc(p.code)}</div>` : ''}
      ${p.description ? `<p class="desc">${esc(p.description)}</p>` : ''}
      ${specs ? `<div class="specs"><div class="specs__head caps">Technical specifications</div>${specs}</div>` : ''}
    </div>
  </div>

  ${rest.length ? `
  <div class="gallery">
    <div class="gallery__head caps">Gallery</div>
    <div class="grid">${gallery}</div>
  </div>` : ''}

</body></html>`;
}

import { Product } from 'shared';

const BG = [251, 249, 245];
const TEXT = [27, 28, 26];
const MUTED = [110, 106, 100];
const LINE = [226, 223, 217];
const DARK = [44, 40, 37];
const GALLERY_COLS = 2;
const GALLERY_RATIO = 4 / 3;

export async function downloadProductPdf(p: Product): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const W = 210;
  const H = 297;
  const M = 16;
  const CW = W - M * 2;

  const color = (c: number[]) => doc.setTextColor(c[0], c[1], c[2]);
  const hline = (x1: number, y: number, x2: number) => {
    doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
    doc.setLineWidth(0.2);
    doc.line(x1, y, x2, y);
  };
  const paintPage = () => {
    doc.setFillColor(BG[0], BG[1], BG[2]);
    doc.rect(0, 0, W, H, 'F');
  };
  const newPage = () => {
    doc.addPage();
    paintPage();
    return M;
  };
  const caps = (s: string, x: number, y: number, size: number, c: number[], right = false) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    color(c);
    doc.text(s.toUpperCase(), x, y, { charSpace: 0.3, align: right ? 'right' : 'left' });
  };

  paintPage();


  const imgs = [...p.productImages].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));

  const HW = 96;
  const HH = 112;

  const loaded = await Promise.all(
    imgs.map((im, i) =>
      loadCropped(
        im.imagesUrl,
        i === 0 ? HW / HH : GALLERY_RATIO,
        i === 0 ? 1400 : 1000
      ).catch(() => null)
    )
  );

  // ---------- Top bar ----------
  let y = M;
  caps(p.category, M, y, 7, MUTED);
  if (p.code) caps(`Ref. ${p.code}`, W - M, y, 7, MUTED, true);
  y += 4;
  hline(M, y, W - M);
  const top = y + 10;

  if (loaded[0]) {
    doc.addImage(loaded[0], 'JPEG', M, top, HW, HH);

    const cap = `PLATE 01 — ${doc.splitTextToSize(p.name, 70)[0]}`.toUpperCase();
    doc.setFontSize(6);
    const capW = doc.getTextWidth(cap) + 8;
    doc.setFillColor(DARK[0], DARK[1], DARK[2]);
    doc.rect(M + 3, top + HH - 9, capW, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(cap, M + 6, top + HH - 5, { charSpace: 0.25 });
  }

  let rx = M + HW + 10;
  let rw = W - M - rx;
  let ry = top + 6;
  let movedToNewPage = false;

  doc.setFont('times', 'normal');
  doc.setFontSize(24);
  color(TEXT);
  const titleLines = doc.splitTextToSize(p.name, rw);
  doc.text(titleLines, rx, ry);
  ry += titleLines.length * 9.5;

  if (p.code) {
    caps(`Ref. ${p.code}`, rx, ry, 6.5, MUTED);
    ry += 8;
  }

  if (p.description) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    color(MUTED);
    const lines = doc.splitTextToSize(p.description, rw);
    doc.text(lines, rx, ry);
    ry += lines.length * 4.4 + 8;
  } else {
    ry += 4;
  }

  if (p.technicalSpecification.length) {
    hline(rx, ry, rx + rw);
    caps('Technical specifications', rx, ry + 5.5, 6.5, MUTED);
    ry += 9;
    hline(rx, ry, rx + rw);

    let labelW = 26;

    for (const s of p.technicalSpecification) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const vals = doc.splitTextToSize(String(s.value ?? ''), rw - labelW);
      const rowH = Math.max(vals.length * 4.6, 4) + 8;


      if (ry + rowH > H - M - 12) {
        ry = newPage();
        rx = M;
        rw = CW;
        labelW = 40;
        movedToNewPage = true;
        hline(rx, ry, rx + rw);
      }

      caps(String(s.name), rx, ry + 5.4, 6.5, MUTED);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      color(TEXT);
      doc.text(vals, rx + labelW, ry + 5.4);

      ry += rowH;
      hline(rx, ry, rx + rw);
    }
  }

   // ---------- معرض الصور ----------
  const rest = loaded.slice(1).filter((d): d is string => !!d);

  if (rest.length) {
    y = movedToNewPage ? ry + 12 : Math.max(top + HH, ry) + 14;

    const gap = 6;
    const cellW = (CW - gap * (GALLERY_COLS - 1)) / GALLERY_COLS;
    const cellH = cellW / GALLERY_RATIO;
    const rowH = cellH + 9;

    if (y + 12 + rowH > H - M - 12) y = newPage();

    caps('Gallery', M, y, 6.5, MUTED);
    y += 3;
    hline(M, y, W - M);
    y += 6;

    rest.forEach((data, i) => {
      const col = i % GALLERY_COLS;
      if (col === 0 && i > 0) y += rowH;
      if (col === 0 && y + rowH > H - M - 12) y = newPage();

      const x = M + col * (cellW + gap);
      doc.addImage(data, 'JPEG', x, y, cellW, cellH);
      caps(String(i + 2).padStart(2, '0'), x, y + cellH + 4.5, 6.5, MUTED);
    });
  }
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    hline(M, H - 13, W - M);
    caps(p.name.length > 50 ? p.name.slice(0, 50) + '…' : p.name, M, H - 8.5, 6, MUTED);
    caps(`${i} / ${pages}`, W - M, H - 8.5, 6, MUTED, true);
  }

  doc.save(`${p.slug || 'product'}.pdf`);
}

function loadCropped(url: string, ratio: number, maxW: number): Promise<string> {
  const src = url.includes('/upload/')
    ? url.replace('/upload/', '/upload/w_1600,q_auto/')
    : url;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;

      let sw = iw;
      let sh = iw / ratio;
      if (sh > ih) {
        sh = ih;
        sw = ih * ratio;
      }
      const sx = (iw - sw) / 2;
      const sy = (ih - sh) / 2;

      const cw = Math.min(maxW, Math.round(sw));
      const ch = Math.round(cw / ratio);

      const c = document.createElement('canvas');
      c.width = cw;
      c.height = ch;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = src;
  });
}

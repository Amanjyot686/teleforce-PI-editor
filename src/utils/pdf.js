import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const A4_W_MM = 210;
const A4_H_MM = 297;
const PAGE_W_PX = 794;
const PAGE_H_PX = 1123;
// Content up to this much taller than A4 is shrunk onto one page; beyond that it is split.
const MAX_SHRINK = 1.35;

async function waitForImages(node) {
  const imgs = Array.from(node.querySelectorAll('img'));
  await Promise.all(
    imgs.map((img) =>
      img.complete ? Promise.resolve() : new Promise((r) => { img.onload = r; img.onerror = r; }),
    ),
  );
  if (document.fonts?.ready) await document.fonts.ready;
}

export async function downloadInvoicePdf(node, fileName) {
  await waitForImages(node);

  const canvas = await html2canvas(node, {
    scale: 3,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    windowWidth: PAGE_W_PX,
  });

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  const contentHeightPx = node.offsetHeight;
  const ratio = contentHeightPx / PAGE_H_PX;

  if (ratio <= MAX_SHRINK) {
    // Single page — shrink proportionally (centred) if slightly taller than A4.
    const scale = Math.min(1, 1 / ratio);
    const w = A4_W_MM * scale;
    const h = (canvas.height / canvas.width) * w;
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', (A4_W_MM - w) / 2, 0, w, h);
  } else {
    // Split into A4-height slices, breaking only between table rows.
    const px = canvas.width / PAGE_W_PX;
    const top = node.getBoundingClientRect().top;
    const breaks = Array.from(node.querySelectorAll('tr'))
      .map((tr) => Math.round((tr.getBoundingClientRect().bottom - top) * px))
      .sort((a, b) => a - b);
    const sliceHeight = Math.floor((canvas.width * A4_H_MM) / A4_W_MM);
    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    const ctx = slice.getContext('2d');
    for (let y = 0, page = 0; y < canvas.height; page++) {
      let end = y + sliceHeight;
      if (end < canvas.height) {
        const fit = breaks.filter((b) => b > y + sliceHeight * 0.3 && b <= end);
        if (fit.length) end = fit[fit.length - 1];
      }
      const h = Math.min(end, canvas.height) - y;
      slice.height = h;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, slice.width, h);
      ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
      if (page > 0) pdf.addPage();
      pdf.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, A4_W_MM, (h * A4_W_MM) / canvas.width);
      y += h;
    }
  }

  pdf.setProperties({ title: fileName, author: 'Garuda Advertising Pvt. Ltd.' });
  pdf.save(`${fileName}.pdf`);
}

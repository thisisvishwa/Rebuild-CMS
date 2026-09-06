/**
 * Minimal PDF builder.
 *
 * We need a real, valid, downloadable file for the placeholder eBook asset so
 * the whole "payment → access → download" flow is testable end-to-end without
 * shipping the actual product. In production, replace this with the real eBook
 * file (see `EBOOK_DOWNLOAD_URL` / a CDN object) — the download endpoint serves
 * the configured asset instead when one is provided.
 */

function escapePdf(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function buildPlaceholderPdf(opts: {
  orderNumber?: string;
  title?: string;
}): Buffer {
  const title = opts.title ?? "Rebuild — Recovery Workbook";
  const orderNumber = opts.orderNumber ?? "";

  const lines = [
    "BT",
    "F1 30 Tf",
    "72 760 Td",
    `(${escapePdf(title)}) Tj`,
    "F1 12 Tf",
    "0 -18 Td",
    "(Placeholder edition - replace this file with your published eBook.) Tj",
    "0 -24 Td",
    `(Order: ${escapePdf(orderNumber)}) Tj`,
    "0 -30 Td",
    "(This is a secure, expiring download generated for testing.) Tj",
    "0 -24 Td",
    "(Chapters, exercises, journal pages and the recovery roadmap appear) Tj",
    "0 -16 Td",
    "(in the full published edition.) Tj",
    "ET",
  ].join("\n");

  const content = streamWrap(lines);
  const objects: string[] = [];
  const indices: number[] = [];

  objects.push("<< /Type /Catalog /Pages 2 0 R >>"); // 1
  objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"); // 2
  objects.push(
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
  ); // 3
  objects.push(content); // 4
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"); // 5

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += "xref\n0 6\n0000000000 65535 f \n";
  offsets.forEach((o) => {
    pdf += `${String(o).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(pdf, "binary");
}

function streamWrap(stream: string): string {
  // ASCII; length in bytes equals string length here.
  return `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
}

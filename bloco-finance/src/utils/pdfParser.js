import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;

export async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const lines = [];
    let lastY = null;
    let currentLine = [];
    for (const item of content.items) {
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 3) {
        if (currentLine.length) lines.push(currentLine.join(' '));
        currentLine = [];
      }
      currentLine.push(item.str);
      lastY = item.transform[5];
    }
    if (currentLine.length) lines.push(currentLine.join(' '));
    pages.push(lines);
  }
  return pages.flat();
}

const BRL_RE = /(\d{1,3}(?:\.\d{3})*,\d{2})/g;
const DATE_RE = /^(\d{2}\/\d{2})/;

// Removes known totals/header lines that aren't individual expenses
const SKIP_PATTERNS = [
  /total/i, /subtotal/i, /saldo/i, /pagamento/i, /credito\s+rotativo/i,
  /limite/i, /vencimento/i, /fatura/i, /encargo/i, /juros/i, /iof/i,
  /^página/i, /^page/i,
];

function shouldSkip(line) {
  return SKIP_PATTERNS.some(re => re.test(line));
}

export function parseExpenses(lines) {
  const expenses = [];
  const uid = () => Math.random().toString(36).slice(2, 9);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || shouldSkip(line)) continue;

    const amounts = [...line.matchAll(BRL_RE)];
    if (!amounts.length) continue;

    const rawValue = amounts[amounts.length - 1][1];
    const value = parseFloat(rawValue.replace(/\./g, '').replace(',', '.'));
    if (isNaN(value) || value <= 0) continue;

    // Extract date if present at start of line
    const dateMatch = line.match(DATE_RE);
    const date = dateMatch ? dateMatch[1] : '';

    // Description: everything before the last amount occurrence
    let desc = line.replace(BRL_RE, '').trim();
    if (dateMatch) desc = desc.replace(dateMatch[0], '').trim();
    desc = desc.replace(/\s{2,}/g, ' ').trim();
    if (!desc) continue;

    expenses.push({ id: uid(), desc, date, value, category: '' });
  }

  return expenses;
}

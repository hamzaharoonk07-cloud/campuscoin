// ---------------------------------------------------------------------------
// CSV import and export
//
// Written by hand rather than pulled from a package because the format students
// actually paste in is small and predictable, and because a hand-written parser
// can give a specific error per row ("row 4: amount is not a number") instead of
// failing the whole file.
//
// Expected header (order does not matter, case does not matter):
//   date, type, amount, category, description
// ---------------------------------------------------------------------------

/** Splits one CSV line, honouring quoted fields that contain commas. */
function splitLine(line) {
  const out = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      // A doubled quote inside a quoted field is a literal quote.
      if (inQuotes && line[i + 1] === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      out.push(field.trim());
      field = '';
    } else {
      field += char;
    }
  }
  out.push(field.trim());
  return out;
}

const REQUIRED = ['date', 'type', 'amount'];

/**
 * Parses a CSV file into rows ready for review.
 * Returns { rows, errors } - bad rows are reported, not silently dropped, so a
 * student can see exactly what needs fixing.
 */
export function parseTransactionCsv(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length);

  if (lines.length < 2) {
    return { rows: [], errors: [{ row: 0, message: 'The file needs a header row and at least one transaction.' }] };
  }

  const header = splitLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ''));
  const missing = REQUIRED.filter((key) => !header.includes(key));
  if (missing.length) {
    return {
      rows: [],
      errors: [{ row: 0, message: `The header is missing: ${missing.join(', ')}. Expected date, type, amount, category, description.` }],
    };
  }

  const index = (key) => header.indexOf(key);
  const rows = [];
  const errors = [];

  lines.slice(1).forEach((line, i) => {
    const rowNumber = i + 2; // +1 for the header, +1 because humans count from 1
    const cells = splitLine(line);
    const get = (key) => (index(key) >= 0 ? cells[index(key)] || '' : '');

    const rawDate = get('date');
    const date = new Date(rawDate.includes('T') ? rawDate : `${rawDate}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) {
      errors.push({ row: rowNumber, message: `"${rawDate}" is not a date Campus Coin understands. Use YYYY-MM-DD.` });
      return;
    }

    const amount = Number(String(get('amount')).replace(/[^0-9.-]/g, ''));
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push({ row: rowNumber, message: `"${get('amount')}" is not an amount greater than zero.` });
      return;
    }

    const type = get('type').toLowerCase();
    if (type !== 'income' && type !== 'expense') {
      errors.push({ row: rowNumber, message: `Type must be "income" or "expense", not "${get('type')}".` });
      return;
    }

    rows.push({
      row: rowNumber,
      date: date.toISOString(),
      type,
      amount: Math.round(amount * 100) / 100,
      categoryName: get('category'),
      description: get('description'),
    });
  });

  return { rows, errors };
}

const escape = (value) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Turns transactions back into a CSV file for download. */
export function toCsv(transactions) {
  const header = ['date', 'type', 'amount', 'category', 'description', 'note'];
  const lines = transactions.map((t) =>
    [
      new Date(t.date).toISOString().slice(0, 10),
      t.type,
      t.amount,
      t.category?.name || '',
      t.description || '',
      t.note || '',
    ]
      .map(escape)
      .join(',')
  );
  return [header.join(','), ...lines].join('\n');
}

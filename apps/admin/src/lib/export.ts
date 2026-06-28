/**
 * CSV / spreadsheet export utilities.
 */

// Spreadsheet formula (CSV) injection guard. A cell that STARTS with =, +, -, @, a
// tab or a carriage return is evaluated as a formula by Excel / Google Sheets — so a
// user who registers with a name like `=HYPERLINK("http://evil",A1)` would get it
// executed when an admin opens the export. Prefix such values with a single quote so
// they are always treated as inert text. Applies to BOTH the CSV and XLSX writers.
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

export function neutralizeFormula(value: string): string {
  return FORMULA_TRIGGER.test(value) ? `'${value}` : value;
}

// For XLSX rows: neutralize string cells, pass numbers/booleans through untouched.
export function sanitizeCell(value: unknown): unknown {
  return typeof value === 'string' ? neutralizeFormula(value) : value;
}

export function escapeCSVField(field: string | number | boolean | null | undefined): string {
  if (field === null || field === undefined) {
    return '';
  }

  const stringField = neutralizeFormula(String(field));

  // If field contains comma, quote, or a CR/LF, wrap in quotes and escape existing quotes.
  if (
    stringField.includes(',') ||
    stringField.includes('"') ||
    stringField.includes('\n') ||
    stringField.includes('\r')
  ) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }

  return stringField;
}

export function generateCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T | string; header: string; accessor?: (row: T) => string | number | boolean | null }[]
): string {
  const headers = columns.map((col) => escapeCSVField(col.header)).join(',');

  const rows = data.map((row) => {
    return columns
      .map((col) => {
        if (col.accessor) {
          return escapeCSVField(col.accessor(row));
        }
        const value = row[col.key as keyof T];
        return escapeCSVField(value as string | number | boolean | null);
      })
      .join(',');
  });

  return [headers, ...rows].join('\n');
}

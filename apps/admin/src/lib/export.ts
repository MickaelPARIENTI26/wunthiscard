/**
 * CSV Export Utilities
 */

export function escapeCSVField(field: string | number | boolean | null | undefined): string {
  if (field === null || field === undefined) {
    return '';
  }

  const stringField = String(field);

  // If field contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
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

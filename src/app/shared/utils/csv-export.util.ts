/** Shared CSV export. Columns map a header label to a row accessor. */
export interface CsvColumn<T> {
  header: string;
  value: (row: T) => unknown;
}

export function exportToCsv<T>(filename: string, columns: CsvColumn<T>[], rows: T[]): void {
  const escape = (val: unknown): string => {
    const s = val === null || val === undefined ? '' : String(val);
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const headerLine = columns.map((c) => escape(c.header)).join(',');
  const dataLines = rows.map((row) => columns.map((c) => escape(c.value(row))).join(','));
  const csv = [headerLine, ...dataLines].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

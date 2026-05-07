export function exportToCsv(filename: string, rows: any[]) {
  if (!rows || !rows.length) {
    return;
  }
  
  const separator = ',';
  const keys = Object.keys(rows[0]);
  
  const csvContent =
    // Add BOM for Excel to properly read UTF-8
    '\uFEFF' +
    keys.join(separator) +
    '\n' +
    rows.map(row => {
      return keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? '' : row[k];
        // Convert dates, objects, etc.
        if (cell instanceof Date) {
          cell = cell.toLocaleString();
        } else if (typeof cell === 'object') {
          cell = JSON.stringify(cell);
        } else {
          cell = cell.toString();
        }
        // Escape quotes and wrap in quotes if there's a comma or newline
        cell = cell.replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(separator);
    }).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

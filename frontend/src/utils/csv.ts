/**
 * CSV Utilities for ExpenseFlow Import/Export.
 */

const SAMPLE_CSV_CONTENT = `Date,Title,Description,Amount,Currency,PaidByEmail,SplitType,ParticipantEmails,SplitValues,Notes,Attachment
2026-06-10,Grocery Shop,Milk and veggies,45.50,USD,john@example.com,EQUAL,john@example.com;sarah@example.com,50;50,Weekly shopping,
2026-06-11,Morning Coffee,Espresso shots,-12.00,EUR,sarah@example.com,EQUAL,sarah@example.com;john@example.com,,Morning caffeine fix,
2026-07-20,Airport Taxi,Cab to hotel,85.00,USD,john@example.com,EQUAL,john@example.com;sarah@example.com;bob@example.com,,,
2026-06-10,Grocery Shop,Milk and veggies,45.50,USD,john@example.com,EQUAL,john@example.com;sarah@example.com,50;50,Weekly shopping,
2026-06-10,Grocery Shop,Milk and veggies,75.20,USD,john@example.com,EQUAL,john@example.com;sarah@example.com,50;50,Weekly shopping,
2026-01-10,Prague Museum,Prague castle tour,30.00,EUR,bob@example.com,EQUAL,bob@example.com;john@example.com,,,
2026-06-12,Steak Lunch,Lunch meeting,120.00,USD,unknown@example.com,EQUAL,john@example.com;unknown@example.com,,,
2026-06-13,Sarah settled up,Repaid John for Berlin Airbnb,50.00,EUR,sarah@example.com,EQUAL,john@example.com,,,
2026-06-13,Train ticket,Munich to Prague,150.00,EUR,john@example.com,PERCENTAGE,john@example.com;sarah@example.com,40;40,,
2026-06-14,Hotel Booking,Hotel stay,400.00,INR,sarah@example.com,EXACT,sarah@example.com;john@example.com,300;200,,
,Missing Title,,100.00,USD,john@example.com,EQUAL,john@example.com,,,
`;

export const downloadSampleCSV = () => {
  const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'expenses_export_sample.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseCSVPreview = (csvContent: string): any[] => {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i];
    
    // Correctly split by comma, ignoring commas inside quotes
    const cols = [];
    let current = '';
    let inQuotes = false;
    
    for (let charIdx = 0; charIdx < currentLine.length; charIdx++) {
      const char = currentLine[charIdx];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cols.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cols.push(current.trim());

    if (cols.length === headers.length) {
      const rowObj: any = { rowIndex: i };
      headers.forEach((header, index) => {
        // Convert header title to camelCase
        const key = header.charAt(0).toLowerCase() + header.slice(1);
        rowObj[key] = cols[index];
      });
      rows.push(rowObj);
    }
  }

  return rows;
};

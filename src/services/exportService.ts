import type { WeeklySchedule } from '../types/Assignment';
import { SERVICE_ROLE_LABELS, ALL_ROLES } from '../types/Assignment';
import { formatDate } from '../utils/dateUtils';

export function exportToCSV(schedules: WeeklySchedule[]): void {
  const headers = [
    'Date',
    'Sunday Type',
    ...ALL_ROLES.map((r) => SERVICE_ROLE_LABELS[r]),
  ];

  const rows = schedules.map((s) => [
    formatDate(s.date),
    s.isThirdSunday ? 'Third Sunday' : 'Regular Sunday',
    ...ALL_ROLES.map((r) => s.assignments[r]?.memberName ?? 'Unassigned'),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');

  downloadFile(csv, 'text/csv', `church-schedule-${Date.now()}.csv`);
}

export function exportToPrintView(schedules: WeeklySchedule[]): void {
  const html = buildPrintHTML(schedules);
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
}

export async function copyToClipboard(schedules: WeeklySchedule[]): Promise<void> {
  const lines: string[] = [];

  for (const s of schedules) {
    lines.push(`=== ${formatDate(s.date)} ${s.isThirdSunday ? '(Third Sunday)' : ''} ===`);
    for (const role of ALL_ROLES) {
      const name = s.assignments[role]?.memberName ?? 'Unassigned';
      lines.push(`  ${SERVICE_ROLE_LABELS[role]}: ${name}`);
    }
    lines.push('');
  }

  await navigator.clipboard.writeText(lines.join('\n'));
}

function downloadFile(content: string, mimeType: string, filename: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildPrintHTML(schedules: WeeklySchedule[]): string {
  const tableRows = schedules
    .map(
      (s) => `
      <tr>
        <td><strong>${formatDate(s.date)}</strong><br/><small>${s.isThirdSunday ? 'Third Sunday' : 'Regular Sunday'}</small></td>
        ${ALL_ROLES.map((r) => `<td>${s.assignments[r]?.memberName ?? '<em>Unassigned</em>'}</td>`).join('')}
      </tr>
    `,
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Church Service Schedule</title>
      <style>
        body { font-family: Georgia, serif; margin: 2cm; color: #1a1a1a; }
        h1 { text-align: center; color: #312e81; margin-bottom: 0.25rem; }
        p.subtitle { text-align: center; color: #6b7280; margin-top: 0; margin-bottom: 2rem; }
        table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        th { background: #312e81; color: white; padding: 0.6rem 0.75rem; text-align: left; }
        td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
        tr:nth-child(even) td { background: #f9fafb; }
        small { color: #6b7280; }
        @media print { @page { margin: 1.5cm; } }
      </style>
    </head>
    <body>
      <h1>Church Service Schedule</h1>
      <p class="subtitle">Generated ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            ${ALL_ROLES.map((r) => `<th>${SERVICE_ROLE_LABELS[r]}</th>`).join('')}
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </body>
    </html>
  `;
}

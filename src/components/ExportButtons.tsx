import { useState } from 'react';
import type { WeeklySchedule } from '../types/Assignment';
import { exportToCSV, exportToPrintView, copyToClipboard } from '../services/exportService';
import { Download, Printer, Copy, CheckCheck } from 'lucide-react';

interface ExportButtonsProps {
  schedules: WeeklySchedule[];
}

export function ExportButtons({ schedules }: ExportButtonsProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await copyToClipboard(schedules);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => exportToCSV(schedules)}
        disabled={schedules.length === 0}
        className="btn-secondary flex items-center gap-2 disabled:opacity-40"
      >
        <Download size={15} />
        Export CSV
      </button>

      <button
        onClick={() => exportToPrintView(schedules)}
        disabled={schedules.length === 0}
        className="btn-secondary flex items-center gap-2 disabled:opacity-40"
      >
        <Printer size={15} />
        Print / PDF
      </button>

      <button
        onClick={handleCopy}
        disabled={schedules.length === 0}
        className="btn-secondary flex items-center gap-2 disabled:opacity-40"
      >
        {copied ? <CheckCheck size={15} className="text-emerald-500" /> : <Copy size={15} />}
        {copied ? 'Copied!' : 'Copy to Clipboard'}
      </button>
    </div>
  );
}

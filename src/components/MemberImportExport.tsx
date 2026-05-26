import { useRef, useState } from 'react';
import { Download, Upload, FileJson, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { downloadMembers, parseMembersFile, type ParseResult } from '../services/memberIO';
import { Modal } from './Modal';

export function MemberImportExport() {
  const { members, importMembers } = useApp();
  const { canWrite } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parse, setParse] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<{ created: number; updated: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasMembers = members.length > 0;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setError(null);
    setDone(null);
    try {
      const text = await file.text();
      setFileName(file.name);
      setParse(parseMembersFile(text, file.name));
    } catch {
      setError('Could not read that file.');
    }
  }

  async function handleConfirmImport() {
    if (!parse) return;
    setImporting(true);
    setError(null);
    try {
      const result = await importMembers(parse.valid);
      setDone(result);
      setParse(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Import failed.');
    } finally {
      setImporting(false);
    }
  }

  function closeModal() {
    setParse(null);
    setDone(null);
    setError(null);
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => downloadMembers(members, 'csv')}
          disabled={!hasMembers}
          className="btn-secondary flex items-center gap-1.5 disabled:opacity-40"
          title="Export members as CSV"
        >
          <FileSpreadsheet size={15} />
          CSV
        </button>
        <button
          onClick={() => downloadMembers(members, 'json')}
          disabled={!hasMembers}
          className="btn-secondary flex items-center gap-1.5 disabled:opacity-40"
          title="Export members as JSON (full backup)"
        >
          <FileJson size={15} />
          JSON
        </button>
        {canWrite && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary flex items-center gap-1.5"
            title="Import members from a CSV or JSON file"
          >
            <Upload size={15} />
            Import
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json,text/csv,application/json"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      {/* Export hint when there's nothing to export */}
      {!hasMembers && (
        <span className="sr-only">No members to export yet.</span>
      )}

      {/* Import preview / confirmation */}
      <Modal
        isOpen={parse !== null || done !== null}
        onClose={closeModal}
        title={done ? 'Import Complete' : 'Import Members'}
      >
        {done ? (
          <div className="space-y-4">
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              Imported successfully — <strong>{done.created}</strong> added,{' '}
              <strong>{done.updated}</strong> updated.
            </p>
            <div className="flex justify-end">
              <button onClick={closeModal} className="btn-primary">
                Done
              </button>
            </div>
          </div>
        ) : (
          parse && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                <span className="font-medium text-slate-800">{fileName}</span> —{' '}
                <strong>{parse.valid.length}</strong> valid member
                {parse.valid.length === 1 ? '' : 's'} ready to import.
              </p>

              <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                Members are matched by <strong>ID</strong>: existing members are updated, new
                ones are added. Nothing is deleted.
              </div>

              {parse.errors.length > 0 && (
                <div className="border border-amber-200 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 text-amber-800 text-sm font-medium">
                    <AlertTriangle size={15} />
                    {parse.errors.length} row{parse.errors.length === 1 ? '' : 's'} skipped
                  </div>
                  <ul className="max-h-40 overflow-y-auto text-xs text-slate-600 divide-y divide-slate-100">
                    {parse.errors.map((err, i) => (
                      <li key={i} className="px-3 py-1.5">
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={importing || parse.valid.length === 0}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <Download size={15} />
                  {importing
                    ? 'Importing…'
                    : `Import ${parse.valid.length} member${parse.valid.length === 1 ? '' : 's'}`}
                </button>
              </div>
            </div>
          )
        )}
      </Modal>
    </>
  );
}

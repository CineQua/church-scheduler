import type { Member } from '../types/Member';
import { MemberSchema } from '../types/Member';
import { getRankByName } from '../data/rankHierarchy';

// Columns used for CSV export/import (in order). assignmentHistory and other
// optional fields are intentionally CSV-omitted; use JSON for full fidelity.
const CSV_COLUMNS = [
  'id',
  'fullName',
  'gender',
  'age',
  'rankName',
  'rankLevel',
  'rankCategory',
  'isActive',
  'isAvailable',
  'notes',
] as const;

export interface ParseResult {
  valid: Member[];
  errors: string[];
}

// ─── Export ─────────────────────────────────────────────────────────────────

function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export function membersToCsv(members: Member[]): string {
  const header = CSV_COLUMNS.join(',');
  const rows = members.map((m) =>
    CSV_COLUMNS.map((col) => csvCell((m as Record<string, unknown>)[col])).join(','),
  );
  return [header, ...rows].join('\r\n');
}

export function membersToJson(members: Member[]): string {
  return JSON.stringify(members, null, 2);
}

export function downloadMembers(members: Member[], format: 'csv' | 'json'): void {
  const stamp = new Date().toISOString().slice(0, 10);
  const content = format === 'csv' ? membersToCsv(members) : membersToJson(members);
  const mime = format === 'csv' ? 'text/csv' : 'application/json';
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `church-members-${stamp}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Parsing helpers ──────────────────────────────────────────────────────────

function generateId(index: number): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `member-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`;
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (value == null || value === '') return fallback;
  const s = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'active', 'available'].includes(s)) return true;
  if (['false', '0', 'no', 'n', 'inactive', 'unavailable'].includes(s)) return false;
  return fallback;
}

/** RFC-4180-ish CSV parser: handles quoted fields, escaped quotes, CR/LF. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  // Trailing field/row (file not ending in newline)
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

/**
 * Turn a loose record (from CSV or JSON) into a candidate Member, filling
 * sensible defaults: generated id, derived rank level/category from the rank
 * name, empty assignment history, and active/available defaulting to true.
 */
function normalize(raw: Record<string, unknown>, index: number): unknown {
  const rankName = raw.rankName != null ? String(raw.rankName).trim() : '';
  const rankDef = getRankByName(rankName);

  const rankLevel =
    raw.rankLevel != null && String(raw.rankLevel).trim() !== ''
      ? Number(raw.rankLevel)
      : rankDef?.level;
  const rankCategory =
    raw.rankCategory != null && String(raw.rankCategory).trim() !== ''
      ? String(raw.rankCategory).trim()
      : rankDef?.category;

  return {
    ...raw,
    id: raw.id != null && String(raw.id).trim() !== '' ? String(raw.id).trim() : generateId(index),
    fullName: raw.fullName != null ? String(raw.fullName).trim() : '',
    gender: raw.gender != null ? String(raw.gender).trim() : '',
    age: raw.age != null && String(raw.age).trim() !== '' ? Number(raw.age) : undefined,
    rankName,
    rankLevel,
    rankCategory,
    isActive: parseBoolean(raw.isActive, true),
    isAvailable: parseBoolean(raw.isAvailable, true),
    notes:
      raw.notes != null && String(raw.notes).trim() !== '' ? String(raw.notes).trim() : undefined,
    assignmentHistory: Array.isArray(raw.assignmentHistory) ? raw.assignmentHistory : [],
  };
}

function validateAll(records: Record<string, unknown>[]): ParseResult {
  const valid: Member[] = [];
  const errors: string[] = [];

  records.forEach((raw, i) => {
    const candidate = normalize(raw, i);
    const result = MemberSchema.safeParse(candidate);
    if (result.success) {
      valid.push(result.data as Member);
    } else {
      const name = (raw.fullName as string) || `row ${i + 1}`;
      const issue = result.error.errors[0];
      errors.push(`${name}: ${issue?.path[0] ?? ''} ${issue?.message ?? 'invalid'}`.trim());
    }
  });

  return { valid, errors };
}

// ─── Import ─────────────────────────────────────────────────────────────────

export function parseMembersFile(text: string, filename: string): ParseResult {
  const isJson = filename.toLowerCase().endsWith('.json') || text.trim().startsWith('[');

  if (isJson) {
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return { valid: [], errors: ['File is not valid JSON.'] };
    }
    const arr = Array.isArray(data)
      ? data
      : Array.isArray((data as { members?: unknown }).members)
        ? (data as { members: unknown[] }).members
        : null;
    if (!arr) return { valid: [], errors: ['JSON must be an array of members.'] };
    return validateAll(arr as Record<string, unknown>[]);
  }

  // CSV
  const rows = parseCsv(text);
  if (rows.length < 2) return { valid: [], errors: ['CSV has no data rows.'] };
  const headers = rows[0].map((h) => h.trim());
  const records = rows.slice(1).map((cells) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      obj[h] = cells[idx] ?? '';
    });
    return obj;
  });
  return validateAll(records);
}

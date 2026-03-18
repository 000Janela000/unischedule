import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/lib/google-auth';
import { readFileCache, writeFileCache } from '@/lib/sheets/persistent-cache';
import * as XLSX from 'xlsx';
import type { Lecture } from '@/types';

const LECTURE_FILE_ID = process.env.LECTURE_SHEET_ID || '1PY7AyDut0EjvzIW6C6bLH-2iFYIbLVau';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const TARGET_SHEET = 'Total Schedule as a List';
const FILE_CACHE = 'lectures.json';

let cachedData: { lectures: Lecture[]; timestamp: number } | null = null;

const DAY_MAP: Record<string, number> = {
  'ორშაბათი': 1,
  'სამშაბათი': 2,
  'ოთხშაბათი': 3,
  'ხუთშაბათი': 4,
  'პარასკევი': 5,
  'შაბათი': 6,
};

/**
 * Converts an Excel time decimal to HH:MM string.
 * 0.4166666667 → "10:00", 0.5069444444 → "12:10"
 */
function excelTimeToString(decimal: number): string {
  if (!decimal || typeof decimal !== 'number') return '';
  const totalMinutes = Math.round(decimal * 24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function detectType(value: string): Lecture['type'] {
  const lower = value.toLowerCase();
  if (lower.includes('ლექცია') || lower.includes('lecture')) return 'lecture';
  if (lower.includes('სემინარ') || lower.includes('seminar')) return 'seminar';
  if (lower.includes('ლაბ') || lower.includes('lab')) return 'lab';
  if (lower.includes('პრაქტ') || lower.includes('practic')) return 'seminar';
  return 'lecture';
}

async function fetchLectures(): Promise<Lecture[]> {
  // Check in-memory cache
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    return cachedData.lectures;
  }

  // Check file cache
  const fileCached = readFileCache<Lecture[]>(FILE_CACHE);
  if (fileCached) {
    console.log(`[lectures] File cache hit: ${fileCached.length} lectures`);
    cachedData = { lectures: fileCached, timestamp: Date.now() };
    return fileCached;
  }

  console.log('[lectures] Downloading xlsx from Drive...');
  const drive = getDriveClient();
  const file = await drive.files.get(
    { fileId: LECTURE_FILE_ID, alt: 'media' },
    { responseType: 'arraybuffer' }
  );

  const buffer = Buffer.from(file.data as ArrayBuffer);
  console.log(`[lectures] Downloaded ${buffer.length} bytes`);

  const workbook = XLSX.read(buffer, { type: 'buffer' });

  // Use the "Total Schedule as a List" sheet - clean tabular format
  const sheet = workbook.Sheets[TARGET_SHEET];
  if (!sheet) {
    console.warn(`[lectures] Sheet "${TARGET_SHEET}" not found. Available: ${workbook.SheetNames.join(', ')}`);
    throw new Error(`Sheet "${TARGET_SHEET}" not found in lecture file`);
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  console.log(`[lectures] ${rows.length} rows in "${TARGET_SHEET}"`);

  const lectures: Lecture[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const subject = String(row['საგანი'] || '').trim();
    if (!subject) continue;

    const dayRaw = String(row['დღე'] || '').trim();
    const dayOfWeek = DAY_MAP[dayRaw] || 0;
    if (dayOfWeek === 0) continue;

    const startDecimal = Number(row['დასაწყისი']) || 0;
    const endDecimal = Number(row['დასასრული']) || 0;
    if (startDecimal === 0) continue;

    const startTime = excelTimeToString(startDecimal);
    const endTime = excelTimeToString(endDecimal);
    const group = String(row['ჯგუფი'] || '').trim();
    const lecturer = String(row['ლექტორი'] || '').trim();
    const room = String(row['ოთახი'] || '').trim();
    const typeRaw = String(row['მეც. ტიპი'] || '').trim();

    lectures.push({
      id: `lec-${i}-${dayOfWeek}-${startTime}-${group}`,
      dayOfWeek,
      startTime,
      endTime,
      subject,
      lecturer,
      room,
      type: detectType(typeRaw || subject),
      group,
    });
  }

  console.log(`[lectures] Parsed ${lectures.length} lectures`);
  cachedData = { lectures, timestamp: Date.now() };
  writeFileCache(FILE_CACHE, lectures);
  console.log(`[lectures] Cached ${lectures.length} lectures to memory + file`);
  return lectures;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupFilter = searchParams.get('group')?.trim().toLowerCase();

    const lectures = await fetchLectures();

    const filtered = groupFilter
      ? lectures.filter((l) => {
          const g = l.group.toLowerCase();
          return g === groupFilter || g.includes(groupFilter) || groupFilter.includes(g);
        })
      : lectures;

    return NextResponse.json({
      lectures: filtered,
      total: filtered.length,
    });
  } catch (err) {
    console.error('[lectures] Error:', err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : 'Failed to fetch lectures';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

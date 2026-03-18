import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/lib/google-auth';
import * as XLSX from 'xlsx';
import type { Lecture } from '@/types';

const LECTURE_FILE_ID = process.env.LECTURE_SHEET_ID || '1PY7AyDut0EjvzIW6C6bLH-2iFYIbLVau';
const CACHE_TTL = 15 * 60 * 1000;

let cachedData: { lectures: Lecture[]; timestamp: number } | null = null;

const DAY_MAP: Record<string, number> = {
  'ორშაბათი': 1, 'monday': 1, 'mon': 1,
  'სამშაბათი': 2, 'tuesday': 2, 'tue': 2,
  'ოთხშაბათი': 3, 'wednesday': 3, 'wed': 3,
  'ხუთშაბათი': 4, 'thursday': 4, 'thu': 4,
  'პარასკევი': 5, 'friday': 5, 'fri': 5,
  'შაბათი': 6, 'saturday': 6, 'sat': 6,
};

function detectType(value: string): Lecture['type'] {
  const lower = value.toLowerCase();
  if (lower.includes('ლექცია') || lower.includes('lecture')) return 'lecture';
  if (lower.includes('სემინარ') || lower.includes('seminar')) return 'seminar';
  if (lower.includes('ლაბ') || lower.includes('lab')) return 'lab';
  return 'unknown';
}

function parseLecturesFromRows(rows: Record<string, string>[], headers: string[]): Lecture[] {
  const findCol = (keywords: string[]) =>
    headers.find((h) => keywords.some((k) => h.toLowerCase().includes(k))) || '';

  const dayCol = findCol(['დღე', 'day', 'კვირის']);
  const startCol = findCol(['დაწყ', 'start', 'საათი', 'time', 'დრო']);
  const endCol = findCol(['დასრ', 'end', 'დამთ']);
  const subjectCol = findCol(['საგანი', 'subject', 'სასწავლო', 'კურსი', 'course']);
  const lecturerCol = findCol(['ლექტორ', 'lecturer', 'მასწავლ', 'professor']);
  const roomCol = findCol(['ოთახ', 'room', 'აუდიტ', 'hall']);
  const typeCol = findCol(['ტიპი', 'type']);
  const groupCol = findCol(['ჯგუფ', 'group']);

  console.log('[lectures] Detected columns:', { dayCol, startCol, endCol, subjectCol, lecturerCol, roomCol, typeCol, groupCol });

  const lectures: Lecture[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const dayRaw = String(row[dayCol] || '').trim().toLowerCase();
    const dayOfWeek = DAY_MAP[dayRaw] || 0;
    if (dayOfWeek === 0) continue;

    const subject = String(row[subjectCol] || '').trim();
    if (!subject) continue;

    lectures.push({
      id: `lec-${i}-${dayOfWeek}`,
      dayOfWeek,
      startTime: String(row[startCol] || '').trim(),
      endTime: String(row[endCol] || '').trim(),
      subject,
      lecturer: String(row[lecturerCol] || '').trim(),
      room: String(row[roomCol] || '').trim(),
      type: typeCol ? detectType(String(row[typeCol] || '')) : 'lecture',
      group: String(row[groupCol] || '').trim(),
    });
  }

  return lectures;
}

async function fetchLectures(): Promise<Lecture[]> {
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    return cachedData.lectures;
  }

  const drive = getDriveClient();

  // Download the raw xlsx file from Drive
  console.log('[lectures] Downloading xlsx from Drive...');
  const response = await drive.files.get(
    { fileId: LECTURE_FILE_ID, alt: 'media' },
    { responseType: 'arraybuffer' }
  );

  const buffer = Buffer.from(response.data as ArrayBuffer);
  console.log('[lectures] Downloaded', buffer.length, 'bytes');

  // Parse xlsx with SheetJS
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  console.log('[lectures] Sheets:', workbook.SheetNames);

  // Parse all sheets and combine lectures
  const allLectures: Lecture[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });

    if (jsonData.length === 0) continue;

    const headers = Object.keys(jsonData[0] || {});
    const lectures = parseLecturesFromRows(jsonData, headers);
    console.log(`[lectures] Sheet "${sheetName}": ${lectures.length} lectures from ${jsonData.length} rows`);
    allLectures.push(...lectures);
  }

  cachedData = { lectures: allLectures, timestamp: Date.now() };
  return allLectures;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupFilter = searchParams.get('group')?.toLowerCase().trim();

    const lectures = await fetchLectures();

    const filtered = groupFilter
      ? lectures.filter(
          (l) =>
            !l.group ||
            l.group.trim() === '' ||
            l.group.toLowerCase().includes(groupFilter) ||
            groupFilter.includes(l.group.toLowerCase())
        )
      : lectures;

    return NextResponse.json({
      lectures: filtered,
      total: filtered.length,
    });
  } catch (err) {
    console.error('[lectures] Error:', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch lectures';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

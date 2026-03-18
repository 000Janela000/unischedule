import { NextResponse } from 'next/server';
import { getCached, setCached } from '@/lib/sheets/cache';
import { readFileCache, writeFileCache } from '@/lib/sheets/persistent-cache';
import { discoverSheetTabs } from '@/lib/sheets/discover-tabs';
import { getSheetsClient } from '@/lib/google-auth';
import { parseExamRows } from '@/lib/sheets/parse-exams';
import { doesGroupMatchExam } from '@/lib/group-decoder';
import type { Exam } from '@/types';

const CACHE_KEY = 'all-exams';
const FILE_CACHE = 'exams.json';

/**
 * GET /api/sheets/exams?group=chem24-01&university=agruni
 *
 * Fetches, parses, and caches all exam data from the Google Sheets document
 * using the Sheets API v4 (Service Account auth).
 * Optionally filters by group code and/or university.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupFilter = searchParams.get('group');
    const universityFilter = searchParams.get('university') as
      | 'agruni'
      | 'freeuni'
      | null;

    // Check caches: memory → file → Google API
    let allExams = getCached<Exam[]>(CACHE_KEY);

    if (!allExams) {
      // Try file cache (survives restarts)
      allExams = readFileCache<Exam[]>(FILE_CACHE);
      if (allExams) {
        console.log(`[exams] File cache hit: ${allExams.length} exams`);
        setCached(CACHE_KEY, allExams); // warm up memory cache
      }
    }

    if (!allExams) {
      const sheetId = process.env.EXAM_SHEET_ID;

      if (!sheetId) {
        return NextResponse.json(
          { error: 'EXAM_SHEET_ID environment variable is not configured' },
          { status: 500 }
        );
      }

      // Discover all tabs in the sheet via Sheets API
      const tabs = await discoverSheetTabs(sheetId);

      if (tabs.length === 0) {
        return NextResponse.json(
          { error: 'No sheet tabs found. The sheet may be inaccessible.' },
          { status: 502 }
        );
      }

      console.log(`[exams] Discovered ${tabs.length} tabs`);

      const sheets = getSheetsClient();

      // Fetch ALL tab data using batchGet (single API call instead of 165)
      const ranges = tabs.map((tab) => `'${tab.name}'`);
      const BATCH_SIZE = 50; // batchGet supports up to ~50 ranges per call
      const tabResults: { tab: (typeof tabs)[0]; rows: string[][] }[] = [];

      for (let i = 0; i < ranges.length; i += BATCH_SIZE) {
        const batchRanges = ranges.slice(i, i + BATCH_SIZE);
        const batchTabs = tabs.slice(i, i + BATCH_SIZE);

        try {
          const response = await sheets.spreadsheets.values.batchGet({
            spreadsheetId: sheetId,
            ranges: batchRanges,
            valueRenderOption: 'UNFORMATTED_VALUE',
            dateTimeRenderOption: 'FORMATTED_STRING',
          });

          const valueRanges = response.data.valueRanges || [];
          for (let j = 0; j < batchTabs.length; j++) {
            const rows = (valueRanges[j]?.values as string[][] | undefined) || [];
            tabResults.push({ tab: batchTabs[j], rows });
          }
        } catch (error) {
          console.warn(
            `[exams] batchGet failed for batch ${i / BATCH_SIZE + 1}:`,
            error instanceof Error ? error.message : error
          );
          // Push empty results for this batch
          for (const tab of batchTabs) {
            tabResults.push({ tab, rows: [] });
          }
        }
      }

      console.log(`[exams] Fetched data from ${tabResults.filter(r => r.rows.length > 0).length}/${tabs.length} tabs`);

      // Parse each tab's rows into exams
      allExams = [];
      for (const { tab, rows } of tabResults) {
        if (rows.length === 0) continue;
        try {
          const exams = parseExamRows(rows, tab.name, tab.date);
          console.log(`[exams] Tab "${tab.name}": parsed ${exams.length} exams from ${rows.length} rows`);
          allExams.push(...exams);
        } catch (error) {
          console.warn(
            `[exams] Failed to parse exams for tab "${tab.name}":`,
            error instanceof Error ? error.message : error
          );
        }
      }

      console.log(`[exams] Total parsed: ${allExams.length} exams from ${tabs.length} tabs`);

      // Sort by date and time
      allExams.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      });

      // Cache the combined result (memory + file)
      setCached(CACHE_KEY, allExams);
      writeFileCache(FILE_CACHE, allExams);
      console.log(`[exams] Cached ${allExams.length} exams to memory + file`);
    }

    // Apply filters
    let filtered = allExams;
    const totalBeforeFilter = allExams.length;

    if (universityFilter) {
      filtered = filtered.filter(
        (exam) => exam.university === universityFilter
      );
    }

    if (groupFilter) {
      filtered = filtered.filter((exam) =>
        doesGroupMatchExam(groupFilter, exam.groups)
      );
    }

    // Collect debug info when returning 0 results
    const debugInfo = filtered.length === 0 && groupFilter ? {
      totalExamsBeforeFilter: totalBeforeFilter,
      groupFilter,
      universityFilter,
      allGroupsFound: Array.from(new Set(allExams.flatMap((e) => e.groups))).slice(0, 50),
    } : undefined;

    return NextResponse.json(
      {
        exams: filtered,
        total: filtered.length,
        ...(debugInfo ? { debug: debugInfo } : {}),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[exams] Error in /api/sheets/exams:', error);

    const message =
      error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

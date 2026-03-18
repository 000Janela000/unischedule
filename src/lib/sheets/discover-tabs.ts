import { getSheetsClient } from '@/lib/google-auth';

export interface SheetTab {
  name: string;
  gid: number;
  date: Date | null;
}

/** Cache for discovered tabs: { tabs, expiresAt } */
let tabCache: { tabs: SheetTab[]; expiresAt: number } | null = null;
const TAB_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Parses a tab name in DD/MM format (e.g. "08/10", "15/01") into a Date.
 * Infers year from academic calendar:
 *   - Months Sep-Dec (9-12) -> current academic year start
 *   - Months Jan-Aug (1-8)  -> academic year start + 1
 */
function parseTabNameDate(tabName: string): Date | null {
  const trimmed = tabName.trim();

  // Match DD/MM pattern
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10); // 1-indexed

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  // Infer year from academic calendar
  const now = new Date();
  const currentYear = now.getFullYear();
  const sep15 = new Date(currentYear, 8, 15); // Sep 15
  const academicYearStart = now < sep15 ? currentYear - 1 : currentYear;

  // Sep-Dec belong to the academic year start year
  // Jan-Aug belong to the next calendar year
  const resolvedYear = month >= 9 ? academicYearStart : academicYearStart + 1;

  const date = new Date(resolvedYear, month - 1, day);

  // Validate the date is real
  if (
    date.getFullYear() !== resolvedYear ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * Discovers ALL tabs in the exam sheet using the Sheets API.
 * Returns SheetTab[] with real names, GIDs, and parsed dates.
 * Results are cached for 1 hour.
 */
export async function discoverSheetTabs(sheetId: string): Promise<SheetTab[]> {
  // Check cache
  if (tabCache && Date.now() < tabCache.expiresAt) {
    return tabCache.tabs;
  }

  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
    fields: 'sheets.properties(sheetId,title)',
  });

  const sheetList = response.data.sheets;
  if (!sheetList || sheetList.length === 0) {
    return [];
  }

  const tabs: SheetTab[] = sheetList.map((sheet) => {
    const props = sheet.properties!;
    const name = props.title || '';
    const gid = props.sheetId ?? 0;
    const date = parseTabNameDate(name);

    return { name, gid, date };
  });

  // Cache the result
  tabCache = { tabs, expiresAt: Date.now() + TAB_CACHE_TTL };

  return tabs;
}

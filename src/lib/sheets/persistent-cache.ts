import * as fs from 'fs';
import * as path from 'path';

const CACHE_DIR = process.env.VERCEL
  ? '/tmp'
  : path.join(process.cwd(), 'data');

const DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

function ensureDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

export function readFileCache<T>(filename: string, ttl: number = DEFAULT_TTL): T | null {
  try {
    const filePath = path.join(CACHE_DIR, filename);
    if (!fs.existsSync(filePath)) return null;

    const raw = fs.readFileSync(filePath, 'utf-8');
    const entry: CacheEntry<T> = JSON.parse(raw);

    if (Date.now() - entry.cachedAt > ttl) {
      return null; // stale
    }

    return entry.data;
  } catch {
    return null;
  }
}

export function writeFileCache<T>(filename: string, data: T): void {
  try {
    ensureDir();
    const filePath = path.join(CACHE_DIR, filename);
    const entry: CacheEntry<T> = { data, cachedAt: Date.now() };
    fs.writeFileSync(filePath, JSON.stringify(entry));
  } catch (error) {
    console.warn('[cache] Failed to write file cache:', error instanceof Error ? error.message : error);
  }
}

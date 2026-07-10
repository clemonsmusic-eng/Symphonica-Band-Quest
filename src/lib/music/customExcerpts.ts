import type { Excerpt } from './types';
import { EXCERPTS } from './excerpts';

// User-authored / imported selections, persisted to localStorage so they show up
// in the practice browser (and can be exported to paste into excerpts.ts).
const KEY = 'bq_custom_excerpts';

export function loadCustomExcerpts(): Excerpt[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Excerpt[]) : [];
  } catch {
    return [];
  }
}

function save(list: Excerpt[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore quota */ }
}

/** Add or replace a custom excerpt by id. */
export function saveCustomExcerpt(ex: Excerpt): void {
  const list = loadCustomExcerpts().filter((e) => e.id !== ex.id);
  list.push(ex);
  save(list);
}

export function deleteCustomExcerpt(id: string): void {
  save(loadCustomExcerpts().filter((e) => e.id !== id));
}

/** Built-in + custom selections (custom last), deduped by id. */
export function allExcerpts(): Excerpt[] {
  const custom = loadCustomExcerpts();
  const ids = new Set(custom.map((e) => e.id));
  return [...EXCERPTS.filter((e) => !ids.has(e.id)), ...custom];
}

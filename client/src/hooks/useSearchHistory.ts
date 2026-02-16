const STORAGE_KEY = 'apex-search-history';
const MAX_HISTORY = 10;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export function getSearchHistory(): SearchHistoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function addToHistory(query: string): void {
  const history = getSearchHistory();
  
  const filtered = history.filter(item => item.query.toLowerCase() !== query.toLowerCase());
  
  const newItem: SearchHistoryItem = {
    query,
    timestamp: Date.now(),
  };
  
  const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function removeFromHistory(query: string): void {
  const history = getSearchHistory();
  const updated = history.filter(item => item.query.toLowerCase() !== query.toLowerCase());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearSearchHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

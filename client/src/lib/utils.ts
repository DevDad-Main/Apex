import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function highlightText(text: string, query: string): string {
  if (!query || !text) return text;
  
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  if (terms.length === 0) return text;
  
  // Create regex pattern for all terms
  const pattern = new RegExp(`(${terms.map(t => escapeRegExp(t)).join('|')})`, 'gi');
  
  // Replace matches with highlighted span
  return text.replace(pattern, '<mark class="bg-yellow-200 dark:bg-yellow-800 text-inherit">$1</mark>');
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function generateSnippet(content: string, searchQuery: string, contextLength = 150): string {
  const lowerContent = content.toLowerCase();
  const lowerQuery = searchQuery.toLowerCase();
  
  // Find first occurrence of any search term
  let firstIndex = -1;
  for (const term of lowerQuery.split(/\s+/)) {
    const idx = lowerContent.indexOf(term);
    if (idx !== -1 && (firstIndex === -1 || idx < firstIndex)) {
      firstIndex = idx;
    }
  }

  if (firstIndex === -1) {
    return content.slice(0, contextLength) + (content.length > contextLength ? '...' : '');
  }

  const start = Math.max(0, firstIndex - 60);
  const end = Math.min(content.length, firstIndex + contextLength);
  
  let snippet = content.slice(start, end);
  
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';

  return snippet;
}

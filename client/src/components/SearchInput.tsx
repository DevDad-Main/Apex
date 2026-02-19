import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Clock, Trash2 } from 'lucide-react';
import api from '../lib/api';
import { getSearchHistory, removeFromHistory, clearSearchHistory, SearchHistoryItem } from '../hooks/useSearchHistory';

interface SearchInputProps {
  onSearch: (query: string) => void;
}

export default function SearchInput({ onSearch }: SearchInputProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load history when focused and input is empty
  useEffect(() => {
    if (isFocused && query.length === 0) {
      setHistory(getSearchHistory());
    }
  }, [isFocused, query]);

  // Fetch autocomplete suggestions when query changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (query.length > 0 && isFocused) {
      // Keep suggestions visible while loading
      setShowSuggestions(true);
      debounceRef.current = setTimeout(async () => {
        try {
          abortControllerRef.current = new AbortController();
          console.log('Fetching autocomplete for:', query);
          const results = await api.autocomplete(query, abortControllerRef.current.signal);
          console.log('Got results:', results.length);
          // Only show suggestions if we got results and query still matches
          if (results.length > 0) {
            setSuggestions(results);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
          }
        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'AbortError') {
            return;
          }
          console.error('Autocomplete failed:', error);
          setSuggestions([]);
        } finally {
          setLoadingSuggestions(false);
        }
      }, 200);
    } else {
      setSuggestions([]);
      // Don't immediately hide - let the blur handler handle that
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      onSearch(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const activeList = query.length > 0 ? suggestions : history;
    if (activeList.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < activeList.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const item = activeList[selectedIndex];
      const searchQuery = typeof item === 'string' ? item : item.query;
      setQuery(searchQuery);
      setShowSuggestions(false);
      onSearch(searchQuery);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
  };

  const handleHistoryClick = (item: SearchHistoryItem) => {
    setShowSuggestions(false);
    onSearch(item.query);
  };

  const handleDeleteHistory = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    removeFromHistory(query);
    setHistory(getSearchHistory());
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setHistory([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
      className="relative w-full max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="relative">
        <motion.div
          animate={{
            scale: isFocused ? 1.02 : 1,
          }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="relative"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(e.target.value.length > 0 || history.length > 0);
              setSelectedIndex(-1);
            }}
            onFocus={() => {
              setIsFocused(true);
              // Load history synchronously and show dropdown
              const recentHistory = getSearchHistory();
              setHistory(recentHistory);
              // Show dropdown if there's history or if we have query
              setShowSuggestions(recentHistory.length > 0 || query.length > 0);
            }}
            onBlur={() => {
              setIsFocused(false);
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search the web..."
            className={`
              w-full h-[68px] px-7 pr-16
              bg-[#FEFEFE] dark:bg-[#1A1D24]
              text-[#2D3E50] dark:text-white text-lg
              placeholder:text-[#9CA3AF]
              rounded-2xl
              border-0
              outline-none
              transition-all duration-200
              breathe-animation
              ${isFocused 
                ? 'shadow-[0_1px_3px_rgba(0,0,0,0.05),0_8px_20px_rgba(45,62,80,0.15)]' 
                : 'shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(45,62,80,0.08)]'
              }
            `}
            style={{ fontFamily: "'Manrope', sans-serif" }}
          />
          
          <motion.button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2
                     w-10 h-10 rounded-full
                     bg-[#2D3E50] dark:bg-white text-white dark:text-[#0F1115]
                     flex items-center justify-center
                     transition-transform duration-150 hover:scale-105 active:scale-95
                     hover:bg-[#3d5264] dark:hover:bg-[#E8E7E1]
                     shadow-sm"
          >
            <Search className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Suggestions / History Dropdown */}
        {(showSuggestions || isFocused) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-[calc(100%+8px)] left-0 right-0
                     bg-[#FEFEFE] dark:bg-[#1A1D24] rounded-2xl
                     shadow-[0_4px_20px_rgba(45,62,80,0.12)]
                     overflow-hidden z-50"
          >
            {/* Show autocomplete if there's a query */}
            {query.length > 0 && (
              <>
                {loadingSuggestions ? (
                  <div className="px-7 py-4 text-[#6B7280] dark:text-[#9CA3AF] text-sm">
                    Loading...
                  </div>
                ) : suggestions.length > 0 ? (
                  suggestions.slice(0, 5).map((suggestion, index) => (
                    <button
                      key={suggestion}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`
                        w-full px-7 py-4 text-left
                        text-[#2D3E50] dark:text-white text-base
                        transition-colors duration-150
                        ${selectedIndex === index 
                          ? 'bg-[#F5F5F3] dark:bg-[#2A2D35]' 
                          : 'hover:bg-[#F8F7F4] dark:hover:bg-[#2A2D35]'
                        }
                        ${index !== 0 ? 'border-t border-[#F0EFE9] dark:border-[#2A2D35]' : ''}
                      `}
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      <Search className="w-4 h-4 inline mr-3 opacity-40" />
                      {suggestion}
                    </button>
                  ))
                ) : null}
              </>
            )}

            {/* Show history if no query or no autocomplete results */}
            {query.length === 0 && history.length > 0 && (
              <>
                <div className="flex items-center justify-between px-7 py-3 border-b border-[#F0EFE9] dark:border-[#2A2D35]">
                  <span className="text-xs text-[#9CA3AF] uppercase tracking-wide" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    Recent searches
                  </span>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleClearHistory}
                      className="text-xs text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#2D3E50] dark:hover:text-white transition-colors"
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                    Clear all
                  </button>
                </div>
                {history.map((item, index) => (
                  <div
                    key={item.query}
                    className={`
                      flex items-center justify-between px-7 py-3
                      text-[#2D3E50] dark:text-white text-base
                      hover:bg-[#F8F7F4] dark:hover:bg-[#2A2D35]
                      transition-colors duration-150 cursor-pointer
                      ${index !== 0 ? 'border-t border-[#F0EFE9] dark:border-[#2A2D35]' : ''}
                    `}
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleHistoryClick(item)}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 opacity-40" />
                      {item.query}
                    </div>
                    <button
                      type="button"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => handleDeleteHistory(e, item.query)}
                      className="text-[#9CA3AF] hover:text-[#2D3E50] dark:hover:text-white transition-colors p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </>
            )}

            {/* Empty state for history */}
            {query.length === 0 && history.length === 0 && (
              <div className="px-7 py-4 text-[#6B7280] dark:text-[#9CA3AF] text-sm">
                No recent searches
              </div>
            )}
          </motion.div>
        )}
      </form>
    </motion.div>
  );
}

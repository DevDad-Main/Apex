import { motion } from "framer-motion";
import { Search, ArrowLeft, ChevronLeft, ChevronRight, Moon, Sun } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { SearchResult, PaginationInfo } from "../lib/api";
import api from "../lib/api";
import { useDarkMode } from "../hooks/useDarkMode";

interface SearchResultsProps {
  initialQuery: string;
  onBack: () => void;
  onSearch: (query: string, updateUrl?: boolean, page?: number) => void;
  results: SearchResult[];
  loading: boolean;
  pagination?: PaginationInfo | null;
  onPageChange?: (page: number) => void;
  correction?: string | null;
  responseTime?: number;
}

export default function SearchResults({
  initialQuery,
  onBack,
  onSearch,
  results,
  loading,
  pagination,
  onPageChange,
  correction,
  responseTime = 0,
}: SearchResultsProps) {
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const navigate = useNavigate();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const ThemeToggle = () => (
    <motion.button
      onClick={toggleDark}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#2D3E50] dark:hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0"
      style={{ fontFamily: "'Manrope', sans-serif" }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </motion.button>
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length > 0) {
      setLoadingSuggestions(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await api.autocomplete(query);
          setSuggestions(res);
        } catch {
          setSuggestions([]);
        } finally {
          setLoadingSuggestions(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
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

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedIndex]);
    }
  };

  const handleResultClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname.slice(0, 50);
    } catch {
      return url.slice(0, 50);
    }
  };

  const generateSnippet = (content: string, searchQuery: string) => {
    const lowerContent = content.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);

    if (index === -1) {
      return content.slice(0, 200) + "...";
    }

    const start = Math.max(0, index - 80);
    const end = Math.min(content.length, index + searchQuery.length + 120);
    let snippet = content.slice(start, end);

    if (start > 0) snippet = "..." + snippet;
    if (end < content.length) snippet = snippet + "...";

    return snippet;
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-[#0F1115]">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="sticky top-0 bg-[#FEFEFE] dark:bg-[#0F1115] border-b border-[#E8E7E1] dark:border-[#2A2D35] shadow-sm z-50"
        >
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-6">
              <motion.button
                onClick={onBack}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-[#2D3E50] dark:text-white hover:text-[#3d5264] dark:hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>

              <h2
                className="text-2xl font-light text-[#2D3E50] dark:text-white cursor-pointer hover:opacity-80"
                style={{ fontFamily: "'Fraunces', serif" }}
                onClick={onBack}
              >
                Apex
              </h2>

              <form
                onSubmit={handleSubmit}
                className="flex-1 max-w-2xl relative"
              >
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(e.target.value.length > 0);
                    setSelectedIndex(-1);
                  }}
                  onFocus={() => {
                    if (query.length > 0) setShowSuggestions(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-full h-12 px-5 pr-12
                           bg-[#F8F7F4] dark:bg-[#1A1D24] text-[#2D3E50] dark:text-white
                           rounded-lg border border-[#E8E7E1] dark:border-[#2A2D35]
                           outline-none focus:border-[#2D3E50] dark:focus:border-white
                           transition-all duration-200 placeholder:text-[#9CA3AF]"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2
                           text-[#2D3E50] dark:text-white hover:text-[#3d5264] dark:hover:text-white
                           transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>

                {showSuggestions && query.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-[calc(100%+8px)] left-0 right-0
                             bg-[#FEFEFE] dark:bg-[#1A1D24] rounded-lg
                             shadow-[0_4px_20px_rgba(45,62,80,0.12)]
                             overflow-hidden z-50"
                  >
                    {loadingSuggestions ? (
                      <div className="px-5 py-3 text-[#6B7280] dark:text-[#9CA3AF] text-sm">
                        Loading...
                      </div>
                    ) : suggestions.length > 0 ? (
                      suggestions.slice(0, 5).map((suggestion, index) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`
                            w-full px-5 py-3 text-left
                            text-[#2D3E50] dark:text-white text-base
                            transition-colors duration-150
                            ${
                              selectedIndex === index
                                ? "bg-[#F5F5F3] dark:bg-[#2A2D35]"
                                : "hover:bg-[#F8F7F4] dark:hover:bg-[#2A2D35]"
                            }
                          `}
                          style={{ fontFamily: "'Manrope', sans-serif" }}
                        >
                          <Search className="w-4 h-4 inline mr-3 opacity-40" />
                          {suggestion}
                        </button>
                      ))
                    ) : (
                      <div className="px-5 py-3 text-[#6B7280] dark:text-[#9CA3AF] text-sm">
                        No suggestions
                      </div>
                    )}
                  </motion.div>
                )}
              </form>
            </div>
          </div>
        </motion.header>

        <main className="max-w-3xl mx-auto px-6 py-8 flex items-center justify-center min-h-[50vh]">
          <div
            className="text-[#6B7280] dark:text-[#9CA3AF]"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            Loading...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1115]">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="sticky top-0 bg-[#FEFEFE] dark:bg-[#0F1115] border-b border-[#E8E7E1] dark:border-[#2A2D35] shadow-sm z-50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-6">
            <motion.button
              onClick={onBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-[#2D3E50] dark:text-white hover:text-[#3d5264] dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>

            <h2
              className="text-2xl font-light text-[#2D3E50] dark:text-white cursor-pointer hover:opacity-80"
              style={{ fontFamily: "'Fraunces', serif" }}
              onClick={onBack}
            >
              Apex
            </h2>

              <form onSubmit={handleSubmit} className="flex-1 max-w-2xl relative">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(e.target.value.length > 0);
                  setSelectedIndex(-1);
                }}
                onFocus={() => {
                  if (query.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  // Delay to allow click events to register on mobile
                  setTimeout(() => setShowSuggestions(false), 300);
                }}
                onKeyDown={handleKeyDown}
                onTouchStart={() => {
                  if (query.length > 0) setShowSuggestions(true);
                }}
                className="w-full h-12 px-5 pr-12
                         bg-[#F8F7F4] dark:bg-[#1A1D24] text-[#2D3E50] dark:text-white
                         rounded-lg border border-[#E8E7E1] dark:border-[#2A2D35]
                         outline-none focus:border-[#2D3E50] dark:focus:border-white
                         transition-all duration-200 placeholder:text-[#9CA3AF]"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2
                         text-[#2D3E50] dark:text-white hover:text-[#3d5264] dark:hover:text-white
                         transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>

              {showSuggestions && query.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-[calc(100%+8px)] left-0 right-0
                           bg-[#FEFEFE] dark:bg-[#1A1D24] rounded-lg
                           shadow-[0_4px_20px_rgba(45,62,80,0.12)]
                           overflow-hidden z-50"
                >
                  {loadingSuggestions ? (
                    <div className="px-5 py-3 text-[#6B7280] dark:text-[#9CA3AF] text-sm">
                      Loading...
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.slice(0, 5).map((suggestion, index) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`
                          w-full px-5 py-3 text-left
                          text-[#2D3E50] dark:text-white text-base
                          transition-colors duration-150
                          ${
                            selectedIndex === index
                              ? "bg-[#F5F5F3] dark:bg-[#2A2D35]"
                              : "hover:bg-[#F8F7F4] dark:hover:bg-[#2A2D35]"
                          }
                        `}
                        style={{ fontFamily: "'Manrope', sans-serif" }}
                      >
                        <Search className="w-4 h-4 inline mr-3 opacity-40" />
                        {suggestion}
                      </button>
                    ))
                  ) : (
                    <div className="px-5 py-3 text-[#6B7280] dark:text-[#9CA3AF] text-sm">
                      No suggestions
                    </div>
                  )}
                </motion.div>
              )}
            </form>
          </div>
        </div>
      </motion.header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, delay: 0.05 }}
          className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mb-6"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          {pagination ? (
            <>
              About {pagination.total} results 
              (Page {pagination.page} of {pagination.totalPages})
              {responseTime > 0 && (
                <span className="ml-2 text-[#9CA3AF]">• {responseTime}ms</span>
              )}
            </>
          ) : (
            results?.length > 0 ? `About ${results.length} results` : ''
          )}
        </motion.div>

        <div className="space-y-8">
          {/* Correction suggestion - show prominently at top */}
          {correction && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-[#f0f7f4] dark:bg-[#1a2e25] rounded-xl border border-[#3D5A4C]/20"
            >
              <p 
                className="text-sm text-[#3D5A4C] dark:text-[#6B8E7D]"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Showing results for "{initialQuery}". Did you mean{" "}
                <button 
                  onClick={() => onSearch(correction)}
                  className="font-medium underline hover:no-underline"
                >
                  "{correction}"
                </button>
                ?
              </p>
            </motion.div>
          )}
          
          {(results || []).map((result, index) => {
            // Results now include full document data directly
            if (!result.url) return null;

            return (
              <motion.article
                key={result.documentId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.02 + index * 0.02 }}
                className="group cursor-pointer"
                onClick={() => handleResultClick(result.url)}
              >
                <div
                  className="text-sm text-[#3D5A4C] dark:text-[#6B8E7D] mb-1"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  {formatUrl(result.url)}
                </div>
                <h3
                  className="text-xl text-[#2D3E50] dark:text-white mb-2 
                             group-hover:underline
                             transition-all duration-200"
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  {result.title}
                </h3>
                <p
                  className="text-[#4B5563] dark:text-[#9CA3AF] leading-relaxed"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  {generateSnippet(result.content, initialQuery)}
                </p>
              </motion.article>
            );
          })}
        </div>

        {(results || []).length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 px-4"
          >
            <p
              className="text-[#6B7280] dark:text-[#9CA3AF] text-lg"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              No results found for "{initialQuery}"
            </p>
            {correction && (
              <button
                onClick={() => onSearch(correction)}
                className="block w-full max-w-xs mx-auto mt-4 px-6 py-3 
                         bg-[#3D5A4C] dark:bg-[#4a6b5c] 
                         text-white rounded-xl text-base font-medium
                         hover:opacity-90 active:scale-95
                         transition-all"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Did you mean "{correction}"?
              </button>
            )}
            <p
              className="text-[#9CA3AF] text-sm mt-6"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Try scraping more websites using the API
            </p>
          </motion.div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 mt-12"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm transition-colors ${
                pagination.page <= 1
                  ? "text-[#9CA3AF] cursor-not-allowed"
                  : "text-[#2D3E50] dark:text-white hover:bg-[#F8F7F4] dark:hover:bg-[#2A2D35]"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum: number;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange?.(pageNum)}
                    className={`w-10 h-10 rounded-lg text-sm transition-colors ${
                      pageNum === pagination.page
                        ? "bg-[#2D3E50] dark:bg-white text-white dark:text-[#0F1115]"
                        : "text-[#2D3E50] dark:text-white hover:bg-[#F8F7F4] dark:hover:bg-[#2A2D35]"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm transition-colors ${
                pagination.page >= pagination.totalPages
                  ? "text-[#9CA3AF] cursor-not-allowed"
                  : "text-[#2D3E50] dark:text-white hover:bg-[#F8F7F4] dark:hover:bg-[#2A2D35]"
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </main>

      <footer className="border-t border-[#E8E7E1] dark:border-[#2A2D35] py-6 mt-12">
        <div className="max-w-3xl mx-auto px-6 flex justify-center items-center gap-8">
          <Link
            to="/about"
            className="text-[#6B7280] dark:text-[#9CA3AF] text-sm font-light hover:text-[#2D3E50] dark:hover:text-white transition-colors"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            About
          </Link>
          <Link
            to="/privacy"
            className="text-[#6B7280] dark:text-[#9CA3AF] text-sm font-light hover:text-[#2D3E50] dark:hover:text-white transition-colors"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            Privacy
          </Link>
          <Link
            to="/settings"
            className="text-[#6B7280] dark:text-[#9CA3AF] text-sm font-light hover:text-[#2D3E50] dark:hover:text-white transition-colors"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            Settings
          </Link>
          <ThemeToggle />
        </div>
      </footer>
    </div>
  );
}

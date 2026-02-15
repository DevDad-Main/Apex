import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import api from '../lib/api';

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
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch autocomplete suggestions when query changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length > 0 && isFocused) {
      setLoadingSuggestions(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const results = await api.autocomplete(query);
          setSuggestions(results);
        } catch (error) {
          console.error('Autocomplete failed:', error);
          setSuggestions([]);
        } finally {
          setLoadingSuggestions(false);
        }
      }, 300); // Debounce 300ms
    } else {
      setSuggestions([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, isFocused]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      onSearch(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      setQuery(suggestions[selectedIndex]);
      setShowSuggestions(false);
      onSearch(suggestions[selectedIndex]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
    onSearch(suggestion);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
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
              setShowSuggestions(e.target.value.length > 0);
              setSelectedIndex(-1);
            }}
            onFocus={() => {
              setIsFocused(true);
              if (query.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => {
              setIsFocused(false);
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search the web..."
            className={`
              w-full h-[68px] px-7 pr-16
              bg-[#FEFEFE] 
              text-[#2D3E50] text-lg
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
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute right-3 top-1/2 -translate-y-1/3
                     w-10 h-10 rounded-full
                     bg-[#2D3E50] text-white
                     flex items-center justify-center
                     transition-all duration-200
                     hover:bg-[#3d5264]
                     shadow-sm"
          >
            <Search className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Type-ahead suggestions */}
        {showSuggestions && query.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-[calc(100%+8px)] left-0 right-0
                     bg-[#FEFEFE] rounded-2xl
                     shadow-[0_4px_20px_rgba(45,62,80,0.12)]
                     overflow-hidden z-50"
          >
            {loadingSuggestions ? (
              <div className="px-7 py-4 text-[#6B7280] text-sm">
                Loading...
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.slice(0, 5).map((suggestion, index) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`
                    w-full px-7 py-4 text-left
                    text-[#2D3E50] text-base
                    transition-colors duration-150
                    ${selectedIndex === index 
                      ? 'bg-[#F5F5F3]' 
                      : 'hover:bg-[#F8F7F4]'
                    }
                    ${index !== 0 ? 'border-t border-[#F0EFE9]' : ''}
                  `}
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  <Search className="w-4 h-4 inline mr-3 opacity-40" />
                  {suggestion}
                </button>
              ))
            ) : (
              <div className="px-7 py-4 text-[#6B7280] text-sm">
                No suggestions
              </div>
            )}
          </motion.div>
        )}
      </form>
    </motion.div>
  );
}

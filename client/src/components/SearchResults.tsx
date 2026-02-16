import { motion } from 'framer-motion';
import { Search, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { SearchResult, Document } from '../lib/api';

interface SearchResultsProps {
  initialQuery: string;
  onBack: () => void;
  onSearch: (query: string) => void;
  results: SearchResult[];
  documents: Map<string, Document>;
  loading: boolean;
}

export default function SearchResults({ initialQuery, onBack, onSearch, results, documents, loading }: SearchResultsProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleResultClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
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
      return content.slice(0, 200) + '...';
    }
    
    const start = Math.max(0, index - 80);
    const end = Math.min(content.length, index + searchQuery.length + 120);
    let snippet = content.slice(start, end);
    
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    
    return snippet;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] noise-texture">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="sticky top-0 bg-[#FEFEFE] border-b border-[#E8E7E1] shadow-sm z-50"
        >
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-6">
              <motion.button
                onClick={onBack}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-[#2D3E50] hover:text-[#3d5264] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>

              <h2 
                className="text-2xl font-light text-[#2D3E50]"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Apex
              </h2>

              <form onSubmit={handleSubmit} className="flex-1 max-w-2xl relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-12 px-5 pr-12
                           bg-[#F8F7F4] text-[#2D3E50]
                           rounded-lg border border-[#E8E7E1]
                           outline-none focus:border-[#2D3E50]
                           transition-all duration-200"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2
                           text-[#2D3E50] hover:text-[#3d5264]
                           transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </motion.header>

        <main className="max-w-3xl mx-auto px-6 py-8 flex items-center justify-center min-h-[50vh]">
          <div className="text-[#6B7280]" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Loading...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] noise-texture">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 bg-[#FEFEFE] border-b border-[#E8E7E1] shadow-sm z-50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-6">
            <motion.button
              onClick={onBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-[#2D3E50] hover:text-[#3d5264] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>

            <h2 
              className="text-2xl font-light text-[#2D3E50]"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Apex
            </h2>

            <form onSubmit={handleSubmit} className="flex-1 max-w-2xl relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-12 px-5 pr-12
                         bg-[#F8F7F4] text-[#2D3E50]
                         rounded-lg border border-[#E8E7E1]
                         outline-none focus:border-[#2D3E50]
                         transition-all duration-200"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2
                         text-[#2D3E50] hover:text-[#3d5264]
                         transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </motion.header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-sm text-[#6B7280] mb-6"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          {results.length > 0 
            ? `About ${results.length} results` 
            : 'No results found'}
        </motion.div>

        <div className="space-y-8">
          {results.map((result, index) => {
            const doc = documents.get(result.documentId);
            if (!doc) return null;

            return (
              <motion.article
                key={result.documentId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                className="group cursor-pointer"
                onClick={() => handleResultClick(doc.url)}
              >
                <div className="text-sm text-[#3D5A4C] mb-1" 
                     style={{ fontFamily: "'Manrope', sans-serif" }}>
                  {formatUrl(doc.url)}
                </div>
                <h3 className="text-xl text-[#2D3E50] mb-2 
                             group-hover:underline
                             transition-all duration-200"
                    style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 500 }}>
                  {doc.title}
                </h3>
                <p className="text-[#4B5563] leading-relaxed"
                   style={{ fontFamily: "'Manrope', sans-serif" }}>
                  {generateSnippet(doc.content, initialQuery)}
                </p>
              </motion.article>
            );
          })}
        </div>

        {results.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-[#6B7280]" style={{ fontFamily: "'Manrope', sans-serif" }}>
              No results found for "{initialQuery}"
            </p>
            <p className="text-[#9CA3AF] text-sm mt-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Try scraping some websites first using the API
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}

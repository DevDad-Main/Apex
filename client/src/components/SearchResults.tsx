import { motion } from 'framer-motion';
import { Search, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

interface SearchResultsProps {
  initialQuery: string;
  onBack: () => void;
}

export default function SearchResults({ initialQuery, onBack }: SearchResultsProps) {
  const [query, setQuery] = useState(initialQuery);

  const mockResults = [
    {
      id: 1,
      title: 'Understanding Climate Change: A Comprehensive Guide',
      url: 'example.com/climate-guide',
      snippet: 'Explore the science behind climate change, its effects on our planet, and what actions we can take to mitigate its impact...'
    },
    {
      id: 2,
      title: 'Climate Change Effects on Global Ecosystems',
      url: 'research.org/climate-effects',
      snippet: 'Recent studies show significant changes in biodiversity and ecosystem stability due to rising global temperatures...'
    },
    {
      id: 3,
      title: 'What You Can Do About Climate Change',
      url: 'action.org/climate',
      snippet: 'Individual actions matter. Learn about practical steps you can take to reduce your carbon footprint and contribute to...'
    },
    {
      id: 4,
      title: 'Climate Data and Statistics - 2024 Report',
      url: 'data.gov/climate-2024',
      snippet: 'The latest climate data shows accelerating trends in temperature rise, sea level changes, and extreme weather events...'
    },
    {
      id: 5,
      title: 'Climate Policy and International Agreements',
      url: 'policy.org/climate-agreements',
      snippet: 'An overview of global climate agreements, policy initiatives, and the progress made toward emission reduction targets...'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would trigger a new search
    console.log('Searching for:', query);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] noise-texture">
      {/* Header with search bar */}
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

      {/* Results */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-sm text-[#6B7280] mb-6"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          About 1,234,567 results (0.42 seconds)
        </motion.div>

        <div className="space-y-8">
          {mockResults.map((result, index) => (
            <motion.article
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
              className="group"
            >
              <div className="text-sm text-[#3D5A4C] mb-1" 
                   style={{ fontFamily: "'Manrope', sans-serif" }}>
                {result.url}
              </div>
              <h3 className="text-xl text-[#2D3E50] mb-2 
                           group-hover:underline cursor-pointer
                           transition-all duration-200"
                  style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 500 }}>
                {result.title}
              </h3>
              <p className="text-[#4B5563] leading-relaxed"
                 style={{ fontFamily: "'Manrope', sans-serif" }}>
                {result.snippet}
              </p>
            </motion.article>
          ))}
        </div>

        {/* Pagination */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="flex justify-center gap-3 mt-12 pb-12"
        >
          {[1, 2, 3, 4, 5].map((page) => (
            <button
              key={page}
              className={`w-10 h-10 rounded-lg
                       transition-all duration-200
                       ${page === 1 
                         ? 'bg-[#2D3E50] text-white' 
                         : 'bg-[#F8F7F4] text-[#2D3E50] hover:bg-[#E8E7E1]'
                       }`}
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              {page}
            </button>
          ))}
        </motion.div>
      </main>
    </div>
  );
}

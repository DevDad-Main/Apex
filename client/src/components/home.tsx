import { useState } from 'react';
import SearchLogo from './SearchLogo';
import SearchInput from './SearchInput';
import QuickActions from './QuickActions';
import SearchFooter from './SearchFooter';
import SearchResults from './SearchResults';
import api, { Document, SearchResult } from '../lib/api';

function Home() {
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [documents, setDocuments] = useState<Map<string, Document>>(new Map());
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setLoading(true);
    
    try {
      const results = await api.search(query);
      setSearchResults(results);
      
      if (results.length > 0) {
        const docsMap = new Map<string, Document>();
        for (const result of results) {
          try {
            const doc = await api.getDocument(result.documentId);
            docsMap.set(result.documentId, doc);
          } catch (err) {
            console.error('Failed to fetch document:', result.documentId);
          }
        }
        setDocuments(docsMap);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
      setShowResults(true);
    }
  };

  const handleLuckyClick = () => {
    const luckyQueries = [
      'amazing travel destinations',
      'innovative technology trends',
      'delicious recipes',
      'inspiring art galleries',
      'fascinating science discoveries'
    ];
    const randomQuery = luckyQueries[Math.floor(Math.random() * luckyQueries.length)];
    handleSearch(randomQuery);
  };

  const handleBack = () => {
    setShowResults(false);
    setSearchQuery(null);
    setSearchResults([]);
    setDocuments(new Map());
  };

  if (showResults && searchQuery) {
    return (
      <SearchResults 
        initialQuery={searchQuery} 
        onBack={handleBack}
        onSearch={handleSearch}
        results={searchResults}
        documents={documents}
        loading={loading}
      />
    );
  }

  return (
    <div className="relative w-screen h-screen bg-[#FAF9F6] noise-texture overflow-hidden">
      {/* Radial gradient background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, #FEFEFE 0%, #FAF9F6 100%)'
        }}
      />

      {/* Main content */}
      <div className="relative w-full h-full flex flex-col items-center justify-center px-6">
        <SearchLogo />
        <SearchInput onSearch={handleSearch} />
        <QuickActions onLuckyClick={handleLuckyClick} />
      </div>

      <SearchFooter />
    </div>
  );
}

export default Home;

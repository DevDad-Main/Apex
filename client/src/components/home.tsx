import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import SearchLogo from './SearchLogo';
import SearchInput from './SearchInput';
import QuickActions from './QuickActions';
import SearchFooter from './SearchFooter';
import SearchResults from './SearchResults';
import api, { SearchResult, PaginationInfo } from '../lib/api';
import { addToHistory } from '../hooks/useSearchHistory';

function Home() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const isInitialLoad = useRef(true);

  const handleSearch = async (query: string, updateUrl = true, page = 1) => {
    setSearchQuery(query);
    setLoading(true);
    
    try {
      const response = await api.search(query, page);
      setSearchResults(response.results);
      setPagination(response.pagination);
      
      if (updateUrl) {
        addToHistory(query);
        navigate(`/search?q=${encodeURIComponent(query)}`, { replace: true });
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
      setPagination(null);
    } finally {
      setLoading(false);
      setShowResults(true);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (searchQuery) {
      handleSearch(searchQuery, true, newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!isInitialLoad.current) return;
    isInitialLoad.current = false;
    
    // Only restore search if we're on /search route (not /)
    if (location.pathname === '/search') {
      const query = searchParams.get('q');
      if (query) {
        setSearchQuery(query);
        handleSearch(query, false);
      }
    }
  }, [searchParams, location.pathname]);

  const handleLuckyClick = async () => {
    setLoading(true);
    setSearchQuery('Random');
    
    try {
      const response = await api.getRandom(10);
      setSearchResults(response.results);
      setPagination(response.pagination);
      setShowResults(true);
    } catch (error) {
      console.error('Random search failed:', error);
      setSearchResults([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setShowResults(false);
    setSearchQuery(null);
    setSearchResults([]);
    navigate('/', { replace: true });
  };

  if (showResults && searchQuery) {
    return (
      <SearchResults 
        initialQuery={searchQuery} 
        onBack={handleBack}
        onSearch={handleSearch}
        results={searchResults}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
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

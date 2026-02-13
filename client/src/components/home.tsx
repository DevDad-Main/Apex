import { useState } from 'react';
import SearchLogo from './SearchLogo';
import SearchInput from './SearchInput';
import QuickActions from './QuickActions';
import SearchFooter from './SearchFooter';
import SearchResults from './SearchResults';

function Home() {
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowResults(true);
  };

  const handleLuckyClick = () => {
    // Simulate "I'm Feeling Lucky" - go to first result
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
  };

  if (showResults && searchQuery) {
    return <SearchResults initialQuery={searchQuery} onBack={handleBack} />;
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

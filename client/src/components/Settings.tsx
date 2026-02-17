import { motion } from 'framer-motion';
import { ArrowLeft, History, Trash2, Database, Download, Moon, Sun, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDarkMode } from '../hooks/useDarkMode';

export default function Settings() {
  const { isDark, toggle } = useDarkMode();
  const [searchHistoryEnabled, setSearchHistoryEnabled] = useState(true);
  const [safeSearchEnabled, setSafeSearchEnabled] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('apex_search_history_enabled');
    if (stored !== null) {
      setSearchHistoryEnabled(stored === 'true');
    }
  }, []);

  const handleSearchHistoryToggle = (enabled: boolean) => {
    setSearchHistoryEnabled(enabled);
    localStorage.setItem('apex_search_history_enabled', String(enabled));
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear your search history? This cannot be undone.')) {
      localStorage.removeItem('searchHistory');
      const event = new CustomEvent('clearSearchHistory');
      window.dispatchEvent(event);
      alert('Search history cleared!');
    }
  };

  const clearDatabase = async () => {
    if (confirm('Are you sure you want to delete all indexed documents? You will need to re-scrape content.')) {
      try {
        const response = await fetch('/apex/document', { method: 'DELETE' });
        if (response.ok) {
          alert('Indexed documents cleared!');
        } else {
          alert('Failed to clear documents. Please try again.');
        }
      } catch (error) {
        console.error('Error clearing database:', error);
        alert('Error clearing database.');
      }
    }
  };

  const exportData = () => {
    const data = {
      searchHistory: localStorage.getItem('searchHistory') || '[]',
      settings: {
        searchHistoryEnabled: localStorage.getItem('apex_search_history_enabled'),
        darkMode: localStorage.getItem('apex_dark_mode'),
      },
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apex-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#0F1115]">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 bg-[#FEFEFE]/80 dark:bg-[#0F1115]/80 backdrop-blur-sm border-b border-[#E8E7E1] dark:border-[#2A2D35] z-50"
      >
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-[#2D3E50] dark:text-white hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5" />
            <span style={{ fontFamily: "'Manrope', sans-serif" }}>Back to Search</span>
          </Link>
        </div>
      </motion.header>

      <main className="relative max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 
            className="text-5xl font-light text-[#2D3E50] dark:text-white mb-4"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Settings
          </h1>
          
          <p 
            className="text-xl text-[#6B7280] dark:text-[#9CA3AF] mb-12 max-w-2xl"
            style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 300 }}
          >
            Customize your search experience.
          </p>

          <div className="grid gap-8 mb-16">
            <section>
              <h2 
                className="text-2xl font-light text-[#2D3E50] dark:text-white mb-6"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Search Preferences
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-[#F8F7F4] dark:bg-[#1A1D24] rounded-xl">
                  <div className="flex items-center gap-4">
                    <History className="w-6 h-6 text-[#2D3E50] dark:text-white" />
                    <div>
                      <h3 
                        className="text-[#2D3E50] dark:text-white font-medium"
                        style={{ fontFamily: "'Manrope', sans-serif" }}
                      >
                        Search History
                      </h3>
                      <p 
                        className="text-[#6B7280] dark:text-[#9CA3AF] text-sm"
                        style={{ fontFamily: "'Manrope', sans-serif" }}
                      >
                        Remember your recent searches for faster access
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSearchHistoryToggle(!searchHistoryEnabled)}
                    className={`w-12 h-7 rounded-full transition-colors ${
                      searchHistoryEnabled ? 'bg-[#3D5A4C]' : 'bg-[#E8E7E1] dark:bg-[#2A2D35]'
                    }`}
                  >
                    <div 
                      className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        searchHistoryEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-5 bg-[#F8F7F4] dark:bg-[#1A1D24] rounded-xl">
                  <div className="flex items-center gap-4">
                    <Shield className="w-6 h-6 text-[#2D3E50] dark:text-white" />
                    <div>
                      <h3 
                        className="text-[#2D3E50] dark:text-white font-medium"
                        style={{ fontFamily: "'Manrope', sans-serif" }}
                      >
                        Safe Search
                      </h3>
                      <p 
                        className="text-[#6B7280] dark:text-[#9CA3AF] text-sm"
                        style={{ fontFamily: "'Manrope', sans-serif" }}
                      >
                        Filter out potentially inappropriate results
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSafeSearchEnabled(!safeSearchEnabled)}
                    className={`w-12 h-7 rounded-full transition-colors ${
                      safeSearchEnabled ? 'bg-[#3D5A4C]' : 'bg-[#E8E7E1] dark:bg-[#2A2D35]'
                    }`}
                  >
                    <div 
                      className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        safeSearchEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-5 bg-[#F8F7F4] dark:bg-[#1A1D24] rounded-xl">
                  <div className="flex items-center gap-4">
                    {isDark ? (
                      <Moon className="w-6 h-6 text-[#2D3E50] dark:text-white" />
                    ) : (
                      <Sun className="w-6 h-6 text-[#2D3E50] dark:text-white" />
                    )}
                    <div>
                      <h3 
                        className="text-[#2D3E50] dark:text-white font-medium"
                        style={{ fontFamily: "'Manrope', sans-serif" }}
                      >
                        Dark Mode
                      </h3>
                      <p 
                        className="text-[#6B7280] dark:text-[#9CA3AF] text-sm"
                        style={{ fontFamily: "'Manrope', sans-serif" }}
                      >
                        Use dark theme for better night viewing
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggle}
                    className={`w-12 h-7 rounded-full transition-colors ${
                      isDark ? 'bg-[#3D5A4C]' : 'bg-[#E8E7E1] dark:bg-[#2A2D35]'
                    }`}
                  >
                    <div 
                      className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        isDark ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>

            <section>
              <h2 
                className="text-2xl font-light text-[#2D3E50] dark:text-white mb-6"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Data Management
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-[#F8F7F4] dark:bg-[#1A1D24] p-6 rounded-xl">
                  <Trash2 className="w-8 h-8 text-[#2D3E50] dark:text-white mb-4" />
                  <h3 
                    className="text-lg text-[#2D3E50] dark:text-white mb-2"
                    style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 500 }}
                  >
                    Clear Search History
                  </h3>
                  <p 
                    className="text-[#6B7280] dark:text-[#9CA3AF] text-sm mb-4"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    Remove all your recent searches from local storage
                  </p>
                  <button
                    onClick={clearHistory}
                    className="px-4 py-2 bg-[#2D3E50] dark:bg-white text-white dark:text-[#0F1115] rounded-lg text-sm hover:opacity-90 transition-opacity"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    Clear History
                  </button>
                </div>

                <div className="bg-[#F8F7F4] dark:bg-[#1A1D24] p-6 rounded-xl opacity-50">
                  <Database className="w-8 h-8 text-[#2D3E50] dark:text-white mb-4" />
                  <h3 
                    className="text-lg text-[#2D3E50] dark:text-white mb-2"
                    style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 500 }}
                  >
                    Clear Indexed Data
                  </h3>
                  <p 
                    className="text-[#6B7280] dark:text-[#9CA3AF] text-sm mb-4"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    Delete all documents from your local search index (Coming soon)
                  </p>
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-400 text-gray-200 rounded-lg text-sm cursor-not-allowed"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            </section>

            <section>
              <h2 
                className="text-2xl font-light text-[#2D3E50] dark:text-white mb-6"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Export Data
              </h2>
              
              <div className="bg-[#F8F7F4] dark:bg-[#1A1D24] p-6 rounded-xl">
                <Download className="w-8 h-8 text-[#2D3E50] dark:text-white mb-4" />
                <h3 
                  className="text-lg text-[#2D3E50] dark:text-white mb-2"
                  style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 500 }}
                >
                  Download Your Data
                </h3>
                <p 
                  className="text-[#6B7280] dark:text-[#9CA3AF] text-sm mb-4"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  Export all your search history and settings as JSON
                </p>
                <button
                  onClick={exportData}
                  className="px-4 py-2 border border-[#2D3E50] dark:border-white text-[#2D3E50] dark:text-white rounded-lg text-sm hover:bg-[#2D3E50] hover:text-white dark:hover:bg-white dark:hover:text-[#0F1115] transition-colors"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  Export Data
                </button>
              </div>
            </section>

            <section className="pt-8 border-t border-[#E8E7E1] dark:border-[#2A2D35]">
              <p 
                className="text-[#9CA3AF] text-center"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Your data stays on your device.
                <br />
                &copy; {new Date().getFullYear()} Apex Search Engine.
              </p>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

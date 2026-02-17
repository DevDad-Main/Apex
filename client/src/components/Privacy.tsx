import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Eye, Lock, Database, Globe, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDarkMode } from '../hooks/useDarkMode';

export default function Privacy() {
  const { isDark, toggle } = useDarkMode();

  const ThemeToggle = () => (
    <motion.button
      onClick={toggle}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#2D3E50] dark:hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0"
      style={{ fontFamily: "'Manrope', sans-serif" }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </motion.button>
  );

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#0F1115]">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 bg-[#FEFEFE]/80 dark:bg-[#0F1115]/80 backdrop-blur-sm border-b border-[#E8E7E1] dark:border-[#2A2D35] z-50"
      >
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-[#2D3E50] dark:text-white hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5" />
            <span style={{ fontFamily: "'Manrope', sans-serif" }}>Back to Search</span>
          </Link>
          <ThemeToggle />
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
            Privacy Policy
          </h1>
          
          <p 
            className="text-xl text-[#6B7280] dark:text-[#9CA3AF] mb-12 max-w-2xl"
            style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 300 }}
          >
            Your privacy is fundamental to everything we do.
          </p>

          <div className="grid gap-8 mb-16">
            <section>
              <h2 
                className="text-2xl font-light text-[#2D3E50] dark:text-white mb-4"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Data We Collect
              </h2>
              <p 
                className="text-[#4B5563] dark:text-[#9CA3AF] leading-relaxed"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Apex is designed with minimal data collection in mind. We believe you 
                should control your own information. Here's what we collect:
              </p>
              <ul className="mt-4 space-y-3">
                <li className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-[#2D3E50] dark:text-white mt-0.5 flex-shrink-0" />
                  <span 
                    className="text-[#4B5563] dark:text-[#9CA3AF]"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    <strong className="text-[#2D3E50] dark:text-white">Search queries</strong> — Stored locally in your browser for search history convenience. You can clear this anytime.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-[#2D3E50] dark:text-white mt-0.5 flex-shrink-0" />
                  <span 
                    className="text-[#4B5563] dark:text-[#9CA3AF]"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    <strong className="text-[#2D3E50] dark:text-white">Indexed content</strong> — Only publicly available web content you choose to index through our scraper.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-[#2D3E50] dark:text-white mt-0.5 flex-shrink-0" />
                  <span 
                    className="text-[#4B5563] dark:text-[#9CA3AF]"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    <strong className="text-[#2D3E50] dark:text-white">Anonymous usage data</strong> — Basic analytics to understand how our search engine is used. No personal identifiers.
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 
                className="text-2xl font-light text-[#2D3E50] dark:text-white mb-4"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Data We Don't Collect
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-[#F8F7F4] dark:bg-[#1A1D24] p-5 rounded-xl">
                  <Shield className="w-6 h-6 text-[#3D5A4C] dark:text-[#6B8E7D] mb-3" />
                  <h3 
                    className="text-[#2D3E50] dark:text-white font-medium mb-1"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    No Personal Profiles
                  </h3>
                  <p 
                    className="text-[#6B7280] dark:text-[#9CA3AF] text-sm"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    We don't build profiles based on your search history or browsing behavior.
                  </p>
                </div>

                <div className="bg-[#F8F7F4] dark:bg-[#1A1D24] p-5 rounded-xl">
                  <Lock className="w-6 h-6 text-[#3D5A4C] dark:text-[#6B8E7D] mb-3" />
                  <h3 
                    className="text-[#2D3E50] dark:text-white font-medium mb-1"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    No Account Required
                  </h3>
                  <p 
                    className="text-[#6B7280] dark:text-[#9CA3AF] text-sm"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    Search without signing up. No email, no phone number, no nothing.
                  </p>
                </div>

                <div className="bg-[#F8F7F4] dark:bg-[#1A1D24] p-5 rounded-xl">
                  <Eye className="w-6 h-6 text-[#3D5A4C] dark:text-[#6B8E7D] mb-3" />
                  <h3 
                    className="text-[#2D3E50] dark:text-white font-medium mb-1"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    No Third-Party Tracking
                  </h3>
                  <p 
                    className="text-[#6B7280] dark:text-[#9CA3AF] text-sm"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    We don't share your data with advertisers or data brokers.
                  </p>
                </div>

                <div className="bg-[#F8F7F4] dark:bg-[#1A1D24] p-5 rounded-xl">
                  <Globe className="w-6 h-6 text-[#3D5A4C] dark:text-[#6B8E7D] mb-3" />
                  <h3 
                    className="text-[#2D3E50] dark:text-white font-medium mb-1"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    No Location Tracking
                  </h3>
                  <p 
                    className="text-[#6B7280] dark:text-[#9CA3AF] text-sm"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    We don't track or store your geographic location.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 
                className="text-2xl font-light text-[#2D3E50] dark:text-white mb-4"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Your Controls
              </h2>
              <p 
                className="text-[#4B5563] dark:text-[#9CA3AF] leading-relaxed mb-4"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                You have full control over your data:
              </p>
              <ul className="space-y-3 text-[#4B5563] dark:text-[#9CA3AF]" style={{ fontFamily: "'Manrope', sans-serif" }}>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3D5A4C] dark:bg-[#6B8E7D]" />
                  Clear your local search history anytime
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3D5A4C] dark:bg-[#6B8E7D]" />
                  Disable search history in Settings
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3D5A4C] dark:bg-[#6B8E7D]" />
                  Delete indexed documents from your local database
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3D5A4C] dark:bg-[#6B8E7D]" />
                  Export or remove your data at any time
                </li>
              </ul>
            </section>

            <section>
              <h2 
                className="text-2xl font-light text-[#2D3E50] dark:text-white mb-4"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Contact Us
              </h2>
              <p 
                className="text-[#4B5563] dark:text-[#9CA3AF] leading-relaxed"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Questions about our privacy practices? We'd love to hear from you. 
                While we don't offer formal support channels, we value your feedback 
                and are committed to protecting your privacy.
              </p>
            </section>

            <section className="pt-8 border-t border-[#E8E7E1] dark:border-[#2A2D35]">
              <p 
                className="text-[#9CA3AF] text-center"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Your trust matters.
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

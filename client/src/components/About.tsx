import { motion } from 'framer-motion';
import { Search, Zap, Shield, Database, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="min-h-screen w-full bg-white">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 bg-[#FEFEFE]/80 backdrop-blur-sm border-b border-[#E8E7E1] z-50"
      >
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-[#2D3E50] hover:opacity-80 transition-opacity"
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
            className="text-5xl font-light text-[#2D3E50] mb-4"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            About Apex
          </h1>
          
          <p 
            className="text-xl text-[#6B7280] mb-12 max-w-2xl"
            style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 300 }}
          >
            A modern, privacy-focused search engine built for speed and simplicity.
          </p>

          <div className="grid gap-8 mb-16">
            <section>
              <h2 
                className="text-2xl font-light text-[#2D3E50] mb-4"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Our Mission
              </h2>
              <p 
                className="text-[#4B5563] leading-relaxed"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Apex was built with a simple goal: provide a fast, reliable, and 
                privacy-conscious search experience. We believe search should be 
                instant, results should be relevant, and your data should remain yours.
              </p>
            </section>

            <section>
              <h2 
                className="text-2xl font-light text-[#2D3E50] mb-6"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Key Features
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-[#FEFEFE] p-6 rounded-2xl border border-[#E8E7E1]">
                  <Zap className="w-8 h-8 text-[#2D3E50] mb-4" />
                  <h3 
                    className="text-lg text-[#2D3E50] mb-2"
                    style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 500 }}
                  >
                    Lightning Fast
                  </h3>
                  <p 
                    className="text-[#6B7280] text-sm"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    Optimized search algorithms ensure results appear in milliseconds, 
                    not seconds.
                  </p>
                </div>

                <div className="bg-[#FEFEFE] p-6 rounded-2xl border border-[#E8E7E1]">
                  <Search className="w-8 h-8 text-[#2D3E50] mb-4" />
                  <h3 
                    className="text-lg text-[#2D3E50] mb-2"
                    style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 500 }}
                  >
                    Smart Suggestions
                  </h3>
                  <p 
                    className="text-[#6B7280] text-sm"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    Intelligent autocomplete powered by tries provides relevant 
                    suggestions as you type.
                  </p>
                </div>

                <div className="bg-[#FEFEFE] p-6 rounded-2xl border border-[#E8E7E1]">
                  <Shield className="w-8 h-8 text-[#2D3E50] mb-4" />
                  <h3 
                    className="text-lg text-[#2D3E50] mb-2"
                    style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 500 }}
                  >
                    Privacy First
                  </h3>
                  <p 
                    className="text-[#6B7280] text-sm"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    Your search history stays on your device. We don't track 
                    or store your personal searches.
                  </p>
                </div>

                <div className="bg-[#FEFEFE] p-6 rounded-2xl border border-[#E8E7E1]">
                  <Database className="w-8 h-8 text-[#2D3E50] mb-4" />
                  <h3 
                    className="text-lg text-[#2D3E50] mb-2"
                    style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 500 }}
                  >
                    Curated Results
                  </h3>
                  <p 
                    className="text-[#6B7280] text-sm"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    Results are indexed from quality sources, ensuring you get 
                    reliable information.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 
                className="text-2xl font-light text-[#2D3E50] mb-4"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                How It Works
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div 
                    className="w-8 h-8 rounded-full bg-[#2D3E50] text-white flex items-center justify-center flex-shrink-0"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    1
                  </div>
                  <div>
                    <h4 
                      className="text-[#2D3E50] font-medium mb-1"
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      Inverted Index
                    </h4>
                    <p 
                      className="text-[#6B7280] text-sm"
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      We use an inverted index - a data structure that maps terms 
                      to documents, enabling O(1) lookups for instant results.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div 
                    className="w-8 h-8 rounded-full bg-[#2D3E50] text-white flex items-center justify-center flex-shrink-0"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    2
                  </div>
                  <div>
                    <h4 
                      className="text-[#2D3E50] font-medium mb-1"
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      Binary Search
                    </h4>
                    <p 
                      className="text-[#6B7280] text-sm"
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      Prefix matching uses binary search for O(log n) complexity, 
                      making fuzzy searches fast even with large vocabularies.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div 
                    className="w-8 h-8 rounded-full bg-[#2D3E50] text-white flex items-center justify-center flex-shrink-0"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    3
                  </div>
                  <div>
                    <h4 
                      className="text-[#2D3E50] font-medium mb-1"
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      Trie Data Structure
                    </h4>
                    <p 
                      className="text-[#6B7280] text-sm"
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      Autocomplete suggestions are powered by a Trie (prefix tree), 
                      providing O(m) lookup where m is the query length.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div 
                    className="w-8 h-8 rounded-full bg-[#2D3E50] text-white flex items-center justify-center flex-shrink-0"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    4
                  </div>
                  <div>
                    <h4 
                      className="text-[#2D3E50] font-medium mb-1"
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      Smart Caching
                    </h4>
                    <p 
                      className="text-[#6B7280] text-sm"
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      Frequently searched queries are cached for even faster 
                      subsequent results.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="pt-8 border-t border-[#E8E7E1]">
              <p 
                className="text-[#9CA3AF] text-center"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Built with precision and care.
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

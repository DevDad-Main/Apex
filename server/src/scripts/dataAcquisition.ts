/**
 * @fileoverview Master Data Acquisition Script
 * 
 * This is the central hub for importing data into your Apex search engine.
 * It combines multiple data sources to build a comprehensive dataset.
 * 
 * Usage: 
 *   npx tsx src/scripts/dataAcquisition.ts           # Run all importers
 *   npx tsx src_scripts/dataAcquisition.ts wiki     # Wikipedia only
 *   npx tsx src_scripts/dataAcquisition.ts web       # Web scraping only
 *   npx tsx src_scripts/dataAcquisition.ts api       # Public APIs only
 *   npx tsx src_scripts/dataAcquisition.ts stats     # Show current stats
 * 
 * @module scripts/dataAcquisition
 */

import "dotenv/config";
import { loadDocuments } from "../scraper/persistence.js";
import { invertedIndex } from "../index/invertedIndex.js";
import { trie } from "../autocomplete/trie.js";
import tokenizer, { extractPhrases } from "../textProcessor/tokenizer.js";
import { getAllCategories, DATA_SOURCES } from "./dataSources.js";

interface ImportResult {
  name: string;
  success: boolean;
  count: number;
  error?: string;
}

function printHeader(text: string): void {
  console.log("\n" + "=".repeat(60));
  console.log(`  ${text}`);
  console.log("=".repeat(60));
}

function printStats(): void {
  const docs = loadDocuments();
  const indexDocs = invertedIndex.getAllDocuments();
  
  printHeader("📊 CURRENT DATABASE STATS");
  
  console.log(`\n  📄 Documents in storage: ${docs.length}`);
  console.log(`  🌳 Documents in index: ${indexDocs.size}`);
  console.log(`  📁 Categories: ${getAllCategories().length}`);
  console.log(`  🌐 Sources configured: ${DATA_SOURCES.length}\n`);
  
  const categoryCounts: Record<string, number> = {};
  for (const source of DATA_SOURCES) {
    categoryCounts[source.category] = (categoryCounts[source.category] || 0) + 1;
  }
  
  console.log("  📊 Sources by category:");
  for (const [cat, count] of Object.entries(categoryCounts)) {
    console.log(`     - ${cat}: ${count}`);
  }
  
  console.log("\n" + "=".repeat(60));
}

async function runWikipediaImporter(): Promise<ImportResult> {
  console.log("\n📚 Running Wikipedia Importer...\n");
  
  try {
    const { bulkImport } = await import("./bulkImport.js");
    await bulkImport();
    return { name: "Wikipedia", success: true, count: 200 };
  } catch (error) {
    return { 
      name: "Wikipedia", 
      success: false, 
      count: 0, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

async function runWebScraperImporter(category?: string, limit?: number): Promise<ImportResult> {
  console.log("\n🕷️  Running Web Scraper Importer...\n");
  
  try {
    const { runWebScraper } = await import("./webScraper.js");
    await runWebScraper(category, limit);
    const docs = loadDocuments();
    return { name: "Web Scraper", success: true, count: docs.length };
  } catch (error) {
    return { 
      name: "Web Scraper", 
      success: false, 
      count: 0, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

async function runPublicApiImporter(): Promise<ImportResult> {
  console.log("\n🌐 Running Public API Importer...\n");
  
  try {
    const { runPublicApiFetcher } = await import("./publicApiFetcher.js");
    await runPublicApiFetcher();
    const docs = loadDocuments();
    return { name: "Public APIs", success: true, count: docs.length };
  } catch (error) {
    return { 
      name: "Public APIs", 
      success: false, 
      count: 0, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

function rebuildIndex(): void {
  console.log("\n🔄 Rebuilding search index...\n");
  
  const docs = loadDocuments();
  
  for (const doc of docs) {
    invertedIndex.addDocument({
      id: doc.id,
      url: doc.url,
      title: doc.title,
      content: doc.content
    });
  }
  
  const allDocs = invertedIndex.getAllDocuments();
  const docsArray = Array.from(allDocs.values());
  trie.buildFromDocuments(docsArray, (text: string) => tokenizer(text), extractPhrases);
  
  console.log(`   ✅ Rebuilt index with ${docsArray.length} documents`);
}

async function runAll(): Promise<void> {
  printHeader("🚀 APEX DATA ACQUISITION - MASTER SCRIPT");
  
  console.log("\nThis script will run multiple data importers:");
  console.log("  1. 📚 Wikipedia Importer (200+ articles)");
  console.log("  2. 🕷️  Web Scraper (60+ websites)");
  console.log("  3. 🌐 Public APIs (GitHub, Stack Overflow, etc.)");
  console.log("  4. 🔄 Rebuild search index");
  
  const results: ImportResult[] = [];
  
  printHeader("STEP 1: WIKIPEDIA IMPORT");
  results.push(await runWikipediaImporter());
  
  printHeader("STEP 2: WEB SCRAPING");
  results.push(await runWebScraperImporter());
  
  printHeader("STEP 3: PUBLIC APIs");
  results.push(await runPublicApiImporter());
  
  printHeader("STEP 4: REBUILD INDEX");
  rebuildIndex();
  
  printHeader("📋 FINAL SUMMARY");
  
  for (const result of results) {
    const status = result.success ? "✅" : "❌";
    console.log(`  ${status} ${result.name}: ${result.count} documents`);
    if (result.error) {
      console.log(`     Error: ${result.error}`);
    }
  }
  
  const totalDocs = loadDocuments();
  console.log(`\n  📊 Total documents: ${totalDocs.length}`);
  console.log("=".repeat(60));
  
  console.log("\n✨ Data acquisition complete!");
  console.log("   Your Apex search engine now has a much larger dataset!");
}

async function runSpecific(mode: string): Promise<void> {
  printHeader(`🚀 APEX DATA ACQUISITION - ${mode.toUpperCase()}`);
  
  switch (mode) {
    case "wiki":
      await runWikipediaImporter();
      break;
    case "web":
      await runWebScraperImporter();
      break;
    case "api":
      await runPublicApiImporter();
      break;
    case "stats":
      printStats();
      return;
    case "rebuild":
      rebuildIndex();
      printStats();
      return;
    case "all":
      await runAll();
      return;
    default:
      console.log(`\n❌ Unknown mode: ${mode}`);
      console.log("\nAvailable modes:");
      console.log("  wiki    - Wikipedia importer only");
      console.log("  web     - Web scraper only");
      console.log("  api     - Public API fetcher only");
      console.log("  stats   - Show current database stats");
      console.log("  rebuild - Rebuild search index");
      console.log("  all     - Run all importers (default)");
      process.exit(1);
  }
  
  printStats();
}

const mode = process.argv[2] || "all";
runSpecific(mode).catch(console.error);

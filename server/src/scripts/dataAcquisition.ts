/**
 * @fileoverview Master Data Acquisition Script
 * 
 * Central CLI for importing data into your Apex search engine.
 * Delegates to bulkImport.ts for actual importing.
 * 
 * Usage: 
 *   npx tsx src/scripts/dataAcquisition.ts       # Run all importers
 *   npx tsx src/scripts/dataAcquisition.ts wiki # Wikipedia only
 *   npx tsx src/scripts/dataAcquisition.ts stats     # Show stats
 *   npx tsx src/scripts/dataAcquisition.ts rebuild   # Rebuild search index
 * 
 * @module scripts/dataAcquisition
 */

import "dotenv/config";
import { loadDocuments, saveDocuments, saveDocumentsToCloud } from "../scraper/persistence.js";
import { invertedIndex } from "../index/invertedIndex.js";
import { trie } from "../autocomplete/trie.js";
import tokenizer, { extractPhrases } from "../textProcessor/tokenizer.js";

function printStats(): void {
  const docs = loadDocuments();
  const indexDocs = invertedIndex.getAllDocuments();
  
  console.log("\n" + "=".repeat(50));
  console.log("📊 CURRENT DATABASE STATS");
  console.log("=".repeat(50));
  
  console.log(`\n📄 Documents in storage: ${docs.length}`);
  console.log(`🌳 Documents in index: ${indexDocs.size}\n`);

  // Count by source
  const sourceCount: Record<string, number> = {};
  for (const doc of docs) {
    const url = doc.url;
    let src = "Other";
    if (url.includes("wikipedia")) src = "Wikipedia";
    else if (url.includes("github")) src = "GitHub";
    else if (url.includes("stackoverflow")) src = "StackOverflow";
    else if (url.includes("hacker-news")) src = "HackerNews";
    else if (url.includes("openlibrary")) src = "Books";
    else if (url.includes("dev.to")) src = "DevTo";
    else if (url.includes("reddit")) src = "Reddit";
    else if (url.includes("restcountries")) src = "Geography";
    sourceCount[src] = (sourceCount[src] || 0) + 1;
  }

  console.log("By source:");
  for (const [src, count] of Object.entries(sourceCount)) {
    console.log(`  ${src}: ${count}`);
  }
  console.log("\n" + "=".repeat(50));
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
  
  console.log(`✅ Rebuilt index with ${docsArray.length} documents`);
  printStats();
}

// CLI
const arg = process.argv[2];

switch (arg) {
  case "stats":
    printStats();
    break;
    
  case "rebuild":
    rebuildIndex();
    break;
    
  case undefined:
  case "all":
    // Run bulkImport
    import("./bulkImport.js").then(({ runImport }) => runImport("all")).catch(console.error);
    break;
    
  default:
    // Run specific importer
    import("./bulkImport.js").then(({ runImport }) => runImport(arg)).catch(console.error);
}

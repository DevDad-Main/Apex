/**
 * @fileoverview Multi-source web scraper for data collection.
 * 
 * This script scrapes content from multiple sources across different categories
 * and adds them to the search index.
 * 
 * Usage: npx tsx src/scripts/webScraper.ts [category] [limit]
 * Example: npx tsx src/scripts/webScraper.ts Technology 10
 * 
 * @module scripts/webScraper
 */

import "dotenv/config";
import axios from "axios";
import * as cheerio from "cheerio";
import { v4 as uuidv4 } from "uuid";
import { invertedIndex } from "../index/invertedIndex.js";
import { loadDocuments, saveDocuments, saveDocumentsToCloud } from "../scraper/persistence.js";
import { trie } from "../autocomplete/trie.js";
import tokenizer, { extractPhrases } from "../textProcessor/tokenizer.js";
import { DATA_SOURCES, DataSource, getSourcesByCategory, getAllCategories } from "./dataSources.js";

interface ScrapedDocument {
  id: string;
  url: string;
  title: string;
  content: string;
  category: string;
  scrapedAt: string;
}

const CONCURRENCY_LIMIT = 3;
const REQUEST_TIMEOUT = 15000;
const MIN_CONTENT_LENGTH = 100;

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = 3): Promise<string | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          "User-Agent": "ApexSearchEngine/1.0 (https://github.com/DevDad-Main/Apex; contact@example.com) Bot/1.0",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        maxRedirects: 5,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.log(`  ⚠️  Attempt ${i + 1}/${retries} failed for ${url}: ${errorMessage}`);
      if (i < retries - 1) {
        await delay(1000 * (i + 1));
      }
    }
  }
  return null;
}

function parseHTML(html: string, url: string): ScrapedDocument | null {
  const $ = cheerio.load(html);

  $("script, style, nav, header, footer, aside, .ad, .advertisement, .sidebar, .comments, .social-share, .newsletter, .popup, .modal").remove();

  let title = $("title").text().trim() || 
              $("h1").first().text().trim() || 
              $("meta[property='og:title']").attr("content") || 
              "Untitled";
  
  title = title.replace(/\s+/g, " ").substring(0, 200);

  const articleText: string[] = [];

  $("article, main, .content, .post-content, .entry-content, .article-content, #content, .main-content").find("p, h2, h3, h4, li").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 30 && !text.includes("cookie") && !text.includes("subscribe")) {
      articleText.push(text);
    }
  });

  if (articleText.length === 0) {
    $("p").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 30 && !text.includes("cookie") && !text.includes("subscribe")) {
        articleText.push(text);
      }
    });
  }

  const content = articleText.join(" ").replace(/\s+/g, " ").trim();

  if (content.length < MIN_CONTENT_LENGTH) {
    return null;
  }

  const category = DATA_SOURCES.find(s => s.url === url)?.category || "General";

  return {
    id: uuidv4(),
    url,
    title,
    content: content.substring(0, 50000),
    category,
    scrapedAt: new Date().toISOString()
  };
}

async function scrapeSource(source: DataSource): Promise<ScrapedDocument | null> {
  const html = await fetchWithRetry(source.url);
  if (!html) return null;
  return parseHTML(html, source.url);
}

async function scrapeWithConcurrency(
  sources: DataSource[],
  onProgress: (completed: number, total: number, source: string, success: boolean) => void
): Promise<ScrapedDocument[]> {
  const results: ScrapedDocument[] = [];
  const queue = [...sources];
  
  const processQueue = async (): Promise<void> => {
    while (queue.length > 0) {
      const batch = queue.splice(0, CONCURRENCY_LIMIT);
      const promises = batch.map(async (source) => {
        const doc = await scrapeSource(source);
        onProgress(sources.length - queue.length, sources.length, source.name, !!doc);
        if (doc) {
          results.push(doc);
        }
        await delay(500);
      });
      await Promise.all(promises);
    }
  };

  await processQueue();
  return results;
}

async function addToIndex(documents: ScrapedDocument[]): Promise<void> {
  console.log("\n🌳 Building search index...");
  
  for (const doc of documents) {
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
  
  console.log(`   Indexed ${docsArray.length} documents in Trie`);
}

export async function runWebScraper(category?: string, limit?: number): Promise<void> {
  console.log("🕷️  Starting Multi-Source Web Scraper...\n");

  let sources = category 
    ? getSourcesByCategory(category) 
    : DATA_SOURCES;

  if (limit) {
    sources = sources.slice(0, limit);
  }

  console.log(`📋 Sources to scrape: ${sources.length}`);
  if (category) {
    console.log(`📁 Category: ${category}`);
  } else {
    console.log(`📁 Categories: ${getAllCategories().join(", ")}`);
  }
  console.log("");

  const existingDocs = loadDocuments();
  const existingUrls = new Set(existingDocs.map(d => d.url));
  console.log(`📄 Existing documents: ${existingDocs.length}\n`);

  let completed = 0;
  let successCount = 0;
  let skipCount = 0;

  const documents = await scrapeWithConcurrency(sources, (done, total, sourceName, success) => {
    completed++;
    if (success) {
      successCount++;
      console.log(`[${done}/${total}] ✅ ${sourceName}`);
    } else {
      skipCount++;
      console.log(`[${done}/${total}] ⏭️  ${sourceName} (failed)`);
    }
  });

  console.log("\n💾 Saving to persistence...");
  const newDocs = documents.filter(d => !existingUrls.has(d.url));
  
  for (const doc of newDocs) {
    existingDocs.push({
      id: doc.id,
      url: doc.url,
      title: doc.title,
      content: doc.content,
      scrapedAt: doc.scrapedAt
    });
  }

  saveDocuments(existingDocs);
  console.log(`   Saved ${existingDocs.length} documents`);

  try {
    await saveDocumentsToCloud();
    console.log("   Saved to PostgreSQL");
  } catch (error) {
    console.log("   ⚠️  PostgreSQL not available, skipping cloud save");
  }

  await addToToIndex(newDocs);

  console.log("\n" + "=".repeat(50));
  console.log("✅ Web scraping complete!");
  console.log(`   Successfully scraped: ${successCount}`);
  console.log(`   Already existed: ${skipCount}`);
  console.log(`   New documents added: ${newDocs.length}`);
  console.log(`   Total documents: ${existingDocs.length}`);
  console.log("=".repeat(50));
}

async function addToToIndex(documents: ScrapedDocument[]): Promise<void> {
  if (documents.length === 0) return;
  
  console.log("\n🌳 Building search index...");
  
  for (const doc of documents) {
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
  
  console.log(`   Indexed ${docsArray.length} documents in Trie`);
}

const category = process.argv[2];
const limit = process.argv[3] ? parseInt(process.argv[3]) : undefined;

runWebScraper(category, limit).catch(console.error);

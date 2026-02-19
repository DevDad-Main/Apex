/**
 * @fileoverview Public API data fetcher for collecting structured data.
 * 
 * This script fetches data from various free public APIs and converts them
 * into searchable documents.
 * 
 * Usage: npx tsx src/scripts/publicApiFetcher.ts
 * 
 * @module scripts/publicApiFetcher
 * 
 * Note: Some APIs require API keys. Set them in your .env file:
 * - NEWSAPI_KEY (https://newsapi.org)
 * - OPENWEATHER_KEY (https://openweathermap.org)
 * - COINGECKO_KEY (https://coingecko.com)
 */

import "dotenv/config";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { invertedIndex } from "../index/invertedIndex.js";
import { loadDocuments, saveDocuments, saveDocumentsToCloud } from "../scraper/persistence.js";
import { trie } from "../autocomplete/trie.js";
import tokenizer, { extractPhrases } from "../textProcessor/tokenizer.js";

interface ApiDocument {
  id: string;
  url: string;
  title: string;
  content: string;
  category: string;
  scrapedAt: string;
}

const allDocuments: ApiDocument[] = [];

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createDocument(
  title: string,
  content: string,
  url: string,
  category: string
): ApiDocument {
  return {
    id: uuidv4(),
    url,
    title,
    content,
    category,
    scrapedAt: new Date().toISOString()
  };
}

async function fetchWikipediaBulk(topics: string[]): Promise<ApiDocument[]> {
  console.log("📚 Fetching Wikipedia articles...");
  const documents: ApiDocument[] = [];
  
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext&titles=${topic}&format=json&origin=*`;
      
      const response = await axios.get(url, {
        headers: { "User-Agent": "ApexSearchEngine/1.0" }
      });
      
      const pages = response.data?.query?.pages;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];
        
        if (pageId !== "-1" && page.extract) {
          documents.push(createDocument(
            page.title.replace(/_/g, " "),
            page.extract.substring(0, 20000),
            `https://en.wikipedia.org/wiki/${topic}`,
            "Education"
          ));
          console.log(`  ✅ ${page.title.replace(/_/g, " ")}`);
        }
      }
      
      await delay(200);
    } catch (error) {
      console.log(`  ⚠️  Failed: ${topic}`);
    }
  }
  
  return documents;
}

async function fetchGitHubTrending(): Promise<ApiDocument[]> {
  console.log("🐙 Fetching GitHub trending repos...");
  const documents: ApiDocument[] = [];
  
  const languages = ["javascript", "python", "rust", "go", "typescript"];
  const dates = ["daily", "weekly", "monthly"];
  
  for (const lang of languages) {
    for (const date of dates) {
      try {
        const url = `https://api.github.com/search/repositories?q=created:>${getDateSince(date)}&sort=stars&order=desc&per_page=10`;
        
        const response = await axios.get(url, {
          headers: { 
            "User-Agent": "ApexSearchEngine/1.0",
            "Accept": "application/vnd.github.v3+json"
          }
        });
        
        const repos = response.data?.items || [];
        for (const repo of repos) {
          const content = `
            ${repo.name} - ${repo.description || "No description"}
            
            Language: ${repo.language || "Unknown"}
            Stars: ${repo.stargazers_count}
            Forks: ${repo.forks_count}
            
            Owner: ${repo.owner.login}
            URL: ${repo.html_url}
            
            Readme: ${repo.description}
          `.trim();
          
          documents.push(createDocument(
            `${repo.name} - ${repo.language || "Programming"} Repository`,
            content,
            repo.html_url,
            "Technology"
          ));
        }
        
        console.log(`  ✅ ${lang} (${date}): ${repos.length} repos`);
        await delay(1000);
      } catch (error) {
        console.log(`  ⚠️  Failed: ${lang}/${date}`);
      }
    }
  }
  
  return documents;
}

function getDateSince(period: string): string {
  const date = new Date();
  if (period === "daily") date.setDate(date.getDate() - 1);
  if (period === "weekly") date.setDate(date.getDate() - 7);
  if (period === "monthly") date.setMonth(date.getMonth() - 1);
  return date.toISOString().split("T")[0];
}

async function fetchStackOverflowQuestions(tag: string, pages = 3): Promise<ApiDocument[]> {
  console.log(`📌 Fetching Stack Overflow: ${tag}...`);
  const documents: ApiDocument[] = [];
  
  for (let page = 1; page <= pages; page++) {
    try {
      const url = `https://api.stackexchange.com/2.3/questions?order=desc&sort=activity&tagged=${tag}&pagesize=30&page=${page}&filter=withbody`;
      
      const response = await axios.get(url);
      const questions = response.data?.items || [];
      
      for (const q of questions) {
        const content = `
          ${q.title}
          
          Tags: ${q.tags.join(", ")}
          Score: ${q.score}
          Answers: ${q.answer_count}
          Views: ${q.view_count}
          
          ${q.body?.substring(0, 5000) || ""}
        `.trim();
        
        documents.push(createDocument(
          q.title,
          content,
          q.link,
          "Technology"
        ));
      }
      
      console.log(`  ✅ Page ${page}: ${questions.length} questions`);
      await delay(500);
    } catch (error) {
      console.log(`  ⚠️  Failed page ${page}`);
    }
  }
  
  return documents;
}

async function fetchHackerNewsArticles(type: "top" | "new" | "best" = "top", count = 50): Promise<ApiDocument[]> {
  console.log(`📰 Fetching Hacker News (${type})...`);
  const documents: ApiDocument[] = [];
  
  try {
    const idsUrl = `https://hacker-news.firebaseio.com/v0/${type}stories.json`;
    const idsResponse = await axios.get(idsUrl);
    const ids = idsResponse.data?.slice(0, count) || [];
    
    for (const id of ids) {
      try {
        const itemUrl = `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
        const item = await axios.get(itemUrl);
        
        if (item.data && item.data.type === "story") {
          const content = `
            ${item.data.title}
            
            Score: ${item.data.score || 0}
            By: ${item.data.by}
            Comments: ${item.data.descendants || 0}
            URL: ${item.data.url || `https://news.ycombinator.com/item?id=${id}`}
          `.trim();
          
          documents.push(createDocument(
            item.data.title,
            content,
            item.data.url || `https://news.ycombinator.com/item?id=${id}`,
            "Technology"
          ));
        }
        
        await delay(100);
      } catch (error) {
        // Skip failed items
      }
    }
    
    console.log(`  ✅ Fetched ${documents.length} articles`);
  } catch (error) {
    console.log(`  ⚠️  Failed to fetch Hacker News`);
  }
  
  return documents;
}

async function fetchOpenLibraryAuthors(count = 50): Promise<ApiDocument[]> {
  console.log("📚 Fetching Open Library authors...");
  const documents: ApiDocument[] = [];
  
  const subjects = ["science", "technology", "history", "philosophy", "literature", "art"];
  
  for (const subject of subjects) {
    try {
      const url = `https://openlibrary.org/subjects/${subject}.json?limit=${count}`;
      
      const response = await axios.get(url);
      const works = response.data?.works || [];
      
      for (const work of works) {
        const content = `
          ${work.title}
          
          Author: ${work.authors?.[0]?.name || "Unknown"}
          Subject: ${subject}
          Cover ID: ${work.cover_id || "N/A"}
        `.trim();
        
        documents.push(createDocument(
          work.title,
          content,
          `https://openlibrary.org${work.key}`,
          "Literature"
        ));
      }
      
      console.log(`  ✅ ${subject}: ${works.length} works`);
      await delay(300);
    } catch (error) {
      console.log(`  ⚠️  Failed: ${subject}`);
    }
  }
  
  return documents;
}

async function fetchPublicHolidays(): Promise<ApiDocument[]> {
  console.log("📅 Fetching public holidays...");
  const documents: ApiDocument[] = [];
  
  const year = new Date().getFullYear();
  const countries = ["US", "GB", "CA", "AU", "DE", "FR", "JP", "IN"];
  
  for (const country of countries) {
    try {
      const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`;
      const response = await axios.get(url);
      const holidays = response.data || [];
      
      for (const holiday of holidays) {
        const content = `
          ${holiday.name}
          
          Date: ${holiday.date}
          Country: ${country}
          Type: ${holiday.type}
          ${holiday.counties ? `Counties: ${holiday.counties.join(", ")}` : ""}
        `.trim();
        
        documents.push(createDocument(
          `${holiday.name} (${country})`,
          content,
          `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`,
          "General"
        ));
      }
      
      console.log(`  ✅ ${country}: ${holidays.length} holidays`);
      await delay(200);
    } catch (error) {
      console.log(`  ⚠️  Failed: ${country}`);
    }
  }
  
  return documents;
}

async function fetchCountryInfo(): Promise<ApiDocument[]> {
  console.log("🌍 Fetching country information...");
  const documents: ApiDocument[] = [];
  
  try {
    const response = await axios.get("https://restcountries.com/v3.1/all?fields=name,capital,region,subregion,population,area,languages,currencies,flags,latlng");
    const countries = response.data || [];
    
    for (const country of countries.slice(0, 100)) {
      const languages = Object.values(country.languages || {}).join(", ");
      const currencies = Object.values(country.currencies || {}).map((c: any) => `${c.name} (${c.symbol})`).join(", ");
      
      const content = `
        ${country.name.common} (${country.name.official})
        
        Capital: ${country.capital?.[0] || "N/A"}
        Region: ${country.region}
        Subregion: ${country.subregion || "N/A"}
        Population: ${country.population?.toLocaleString() || "N/A"}
        Area: ${country.area?.toLocaleString() || "N/A"} km²
        Location: ${country.latlng?.[0]}, ${country.latlng?.[1]}
        Languages: ${languages || "N/A"}
        Currency: ${currencies || "N/A"}
        Flag: ${country.flags?.emoji || ""}
      `.trim();
      
      documents.push(createDocument(
        `${country.name.common} - ${country.region}`,
        content,
        `https://restcountries.com/v3.1/name/${country.name.common}`,
        "Geography"
      ));
    }
    
    console.log(`  ✅ ${documents.length} countries`);
  } catch (error) {
    console.log(`  ⚠️  Failed to fetch countries`);
  }
  
  return documents;
}

async function fetchJokes(): Promise<ApiDocument[]> {
  console.log("😂 Fetching jokes...");
  const documents: ApiDocument[] = [];
  
  const categories = ["programming", "misc", "dark", "pun", "spooky", "christmas"];
  
  for (const category of categories) {
    try {
      for (let i = 0; i < 10; i++) {
        const response = await axios.get(`https://v2.jokeapi.dev/joke/${category}?type=single`);
        
        if (response.data?.joke) {
          documents.push(createDocument(
            `Joke: ${category}`,
            response.data.joke,
            `https://v2.jokeapi.dev/joke/${category}`,
            "Entertainment"
          ));
        }
      }
      
      console.log(`  ✅ ${category}: 10 jokes`);
      await delay(200);
    } catch (error) {
      console.log(`  ⚠️  Failed: ${category}`);
    }
  }
  
  return documents;
}

async function addToIndex(documents: ApiDocument[]): Promise<void> {
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

export async function runPublicApiFetcher(): Promise<void> {
  console.log("🌐 Starting Public API Data Fetcher...\n");

  const existingDocs = loadDocuments();
  const existingUrls = new Set(existingDocs.map(d => d.url));
  console.log(`📄 Existing documents: ${existingDocs.length}\n`);

  const results: ApiDocument[] = [];

  results.push(...await fetchWikipediaBulk([
    "Artificial_Intelligence", "Machine_Learning", "Deep_Learning", "Neural_Network",
    "Quantum_Computing", "Blockchain", "Cryptocurrency", "Internet_of_Things",
    "Cybersecurity", "Cloud_Computing", "5G", "Edge_Computing",
    "Climate_Change", "Renewable_Energy", "Sustainability", "Biodiversity",
    "World_War_II", "World_War_I", "Cold_War", "French_Revolution",
    "Renaissance", "Industrial_Revolution", "Ancient_Rome", "Ancient_Greece",
    "Democracy", "Capitalism", "Socialism", "Globalization",
    "Psychology", "Sociology", "Anthropology", "Economics"
  ]));

  results.push(...await fetchGitHubTrending());
  results.push(...await fetchStackOverflowQuestions("javascript", 2));
  results.push(...await fetchStackOverflowQuestions("python", 2));
  results.push(...await fetchStackOverflowQuestions("react", 2));
  results.push(...await fetchStackOverflowQuestions("machine-learning", 2));
  results.push(...await fetchHackerNewsArticles("top", 30));
  results.push(...await fetchHackerNewsArticles("best", 20));
  results.push(...await fetchOpenLibraryAuthors(30));
  results.push(...await fetchPublicHolidays());
  results.push(...await fetchCountryInfo());
  results.push(...await fetchJokes());

  const newDocs = results.filter(d => !existingUrls.has(d.url));
  
  console.log("\n💾 Saving to persistence...");
  
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

  await addToIndex(newDocs);

  console.log("\n" + "=".repeat(50));
  console.log("✅ Public API fetching complete!");
  console.log(`   New documents added: ${newDocs.length}`);
  console.log(`   Total documents: ${existingDocs.length}`);
  console.log("=".repeat(50));
}

runPublicApiFetcher().catch(console.error);

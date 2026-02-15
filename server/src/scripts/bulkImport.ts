/**
 * @fileoverview Bulk import script to fetch Wikipedia articles and add to search index.
 * 
 * This script fetches 100+ Wikipedia articles across multiple categories
 * and adds them to the inverted index and persistence.
 * 
 * Usage: npx ts-node src/scripts/bulkImport.ts
 * 
 * @module scripts/bulkImport
 */

import { v4 as uuidv4 } from "uuid";
import { invertedIndex } from "../index/invertedIndex.js";
import { loadDocuments, saveDocuments } from "../scraper/persistence.js";
import { trie } from "../autocomplete/trie.js";
import tokenizer from "../textProcessor/tokenizer.js";

/**
 * List of 100+ Wikipedia article titles across multiple categories
 */
const TOPICS = {
  // Programming Languages (10)
  programming: [
    "Python",
    "JavaScript",
    "Java_(programming_language)",
    "TypeScript",
    "C++",
    "C_Sharp_(programming_language)",
    "Go_(programming_language)",
    "Rust_(programming_language)",
    "Ruby_(programming_language)",
    "PHP"
  ],
  
  // Web Technologies (10)
  web: [
    "HTML",
    "CSS",
    "HTTP",
    "REST",
    "GraphQL",
    "JSON",
    "XML",
    "AJAX",
    "Web_development",
    "Web_application"
  ],
  
  // Frameworks & Libraries (10)
  frameworks: [
    "React_(web_framework)",
    "Angular_(web_framework)",
    "Vue.js",
    "Node.js",
    "Express.js",
    "Django",
    "Flask_(web_framework)",
    "Spring_(framework)",
    "Laravel",
    "jQuery"
  ],
  
  // AI & Machine Learning (10)
  ai_ml: [
    "Artificial_intelligence",
    "Machine_learning",
    "Deep_learning",
    "Neural_network",
    "Natural_language_processing",
    "Computer_vision",
    "ChatGPT",
    "Large_language_model",
    "Reinforcement_learning",
    "Supervised_learning"
  ],
  
  // Data Science (10)
  data_science: [
    "Data_science",
    "Data_mining",
    "Data_analysis",
    "Statistics",
    "Big_data",
    "Data_visualization",
    "Pandas_(software)",
    "NumPy",
    "TensorFlow",
    "PyTorch"
  ],
  
  // Computer Science Fundamentals (10)
  cs_fundamentals: [
    "Data_structure",
    "Algorithm",
    "Complexity_theory",
    "Recursion",
    "Object-oriented_programming",
    "Functional_programming",
    "Operating_system",
    "Computer_network",
    "Database",
    "SQL"
  ],
  
  // DevOps & Cloud (10)
  devops: [
    "DevOps",
    "Docker_(software)",
    "Kubernetes",
    "Git",
    "CI/CD",
    "Amazon_Web_Services",
    "Microsoft_Azure",
    "Google_Cloud_Platform",
    "Cloud_computing",
    "Infrastructure_as_code"
  ],
  
  // Software Engineering (10)
  software_eng: [
    "Software_engineering",
    "Software_development",
    "Software_architecture",
    "Agile_software_development",
    "Scrum_(software_development)",
    "Waterfall_model",
    "Software_design_pattern",
    "Unit_testing",
    "Integration_testing",
    "Code_review"
  ],
  
  // Security (10)
  security: [
    "Computer_security",
    "Cybersecurity",
    "Encryption",
    "Cryptography",
    "SQL_injection",
    "Cross-site_scripting",
    "Authentication",
    "OAuth",
    "JSON_Web_Token",
    "Malware"
  ],
  
  // General Tech (10)
  general_tech: [
    "Internet",
    "World_Wide_Web",
    "Browser",
    "Server_(computing)",
    "Client-server_model",
    "API",
    "Microservices",
    "Monolithic_application",
    "Frontend_and_backend",
    "Full-stack_development"
  ],
  
  // Science (10)
  science: [
    "Physics",
    "Chemistry",
    "Biology",
    "Mathematics",
    "Quantum_mechanics",
    "Relativity",
    "Genetics",
    "Astronomy",
    "Neuroscience",
    "Climate_change"
  ]
};

/**
 * Flatten topics object into array
 */
function getAllTopics(): string[] {
  const allTopics: string[] = [];
  for (const category of Object.values(TOPICS)) {
    allTopics.push(...category);
  }
  return allTopics;
}

/**
 * Fetch article content from Wikipedia API
 */
async function fetchWikipediaArticle(title: string): Promise<{ title: string; content: string; url: string } | null> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext&titles=${title}&format=json&origin=*`;
  
  try {
    const response = await fetch(url);
    const data = await response.json() as { query?: { pages: Record<string, { title: string; extract?: string }> } };
    
    const pages = data.query?.pages;
    if (!pages) return null;
    
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];
    
    // Skip if page doesn't exist
    if (pageId === "-1" || !page.extract) {
      console.log(`  ⚠️  No content for: ${title}`);
      return null;
    }
    
    return {
      title: page.title.replace(/_/g, " "),
      content: page.extract,
      url: `https://en.wikipedia.org/wiki/${title}`
    };
  } catch (error) {
    console.log(`  ❌ Error fetching ${title}:`, error);
    return null;
  }
}

/**
 * Main import function
 */
async function bulkImport() {
  console.log("🚀 Starting bulk Wikipedia import...\n");
  
  const topics = getAllTopics();
  console.log(`📚 Total topics to import: ${topics.length}\n`);
  
  // Load existing documents
  const existingDocs = loadDocuments();
  console.log(`📄 Existing documents: ${existingDocs.length}\n`);
  
  let successCount = 0;
  let skipCount = 0;
  
  // Fetch and import each topic
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    process.stdout.write(`[${i + 1}/${topics.length}] Fetching: ${topic}... `);
    
    const article = await fetchWikipediaArticle(topic);
    
    if (article) {
      // Add to inverted index
      invertedIndex.addDocument({
        id: uuidv4(),
        url: article.url,
        title: article.title,
        content: article.content
      });
      
      // Save to persistence
      existingDocs.push({
        id: uuidv4(),
        url: article.url,
        title: article.title,
        content: article.content,
        scrapedAt: new Date().toISOString()
      });
      
      console.log(`✅ Added (${article.content.split(" ").length} words)`);
      successCount++;
    } else {
      console.log(`⏭️  Skipped`);
      skipCount++;
    }
    
    // Small delay to be nice to Wikipedia's servers
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Save all documents to persistence
  console.log("\n💾 Saving to persistence...");
  saveDocuments(existingDocs);
  
  // Rebuild Trie with all documents
  console.log("🌳 Building autocomplete Trie...");
  const allDocs = invertedIndex.getAllDocuments();
  const docsArray = Array.from(allDocs.values());
  trie.buildFromDocuments(docsArray, (text: string) => tokenizer(text));
  
  console.log("\n" + "=".repeat(50));
  console.log("✅ Bulk import complete!");
  console.log(`   Successfully imported: ${successCount}`);
  console.log(`   Skipped: ${skipCount}`);
  console.log(`   Total documents: ${existingDocs.length}`);
  console.log("=".repeat(50));
}

// Run the import
bulkImport().catch(console.error);

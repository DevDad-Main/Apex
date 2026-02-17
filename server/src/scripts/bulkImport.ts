/**
 * @fileoverview Bulk import script to fetch Wikipedia articles and add to search index.
 * 
 * This script fetches 100+ Wikipedia articles across multiple categories
 * and adds them to the inverted index and persistence.
 * 
 * Usage: npx tsx src/scripts/bulkImport.ts
 * 
 * @module scripts/bulkImport
 */

import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import { invertedIndex } from "../index/invertedIndex.js";
import { loadDocuments, saveDocuments, saveDocumentsToCloud } from "../scraper/persistence.js";
import { trie } from "../autocomplete/trie.js";
import tokenizer, { extractPhrases } from "../textProcessor/tokenizer.js";

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
  ],

  // History (10)
  history: [
    "World_War_II",
    "World_War_I",
    "French_Revolution",
    "Roman_Empire",
    "Ancient_Egypt",
    "Industrial_Revolution",
    "Renaissance",
    "Cold_War",
    "American_Revolution",
    "Middle_Ages"
  ],

  // Geography (10)
  geography: [
    "Europe",
    "Asia",
    "Africa",
    "North_America",
    "South_America",
    "Australia",
    "Antarctica",
    "Amazon_rainforest",
    "Mount_Everest",
    "Pacific_Ocean"
  ],

  // Sports (10)
  sports: [
    "Football",
    "Basketball",
    "Baseball",
    "Soccer",
    "Tennis",
    "Olympic_Games",
    "Cricket",
    "Golf",
    "Swimming",
    "Marathon"
  ],

  // Health & Medicine (10)
  health: [
    "Human_heart",
    "COVID-19",
    "Vaccine",
    "Cancer",
    "Diabetes",
    "Mental_health",
    "Brain",
    "Immune_system",
    "Antibiotic",
    "Human_genome"
  ],

  // Finance & Economics (10)
  finance: [
    "Stock_market",
    "Bitcoin",
    "Cryptocurrency",
    "Inflation",
    "Gross_Domestic_Product",
    "Federal_Reserve",
    "International_Monetary_Fund",
    "World_Bank",
    "Investment_banking",
    "Financial_crisis_of_2008"
  ],

  // Philosophy (10)
  philosophy: [
    "Philosophy",
    "Existentialism",
    "Stoicism",
    "Karl_Marx",
    "Immanuel_Kant",
    "Plato",
    "Aristotle",
    "Friedrich_Nietzsche",
    "Jean-Paul_Sartre",
    "Logic"
  ],

  // Psychology (10)
  psychology: [
    "Psychology",
    "Cognitive_psychology",
    "Behavioral_psychology",
    "Freud",
    "Mental_disorder",
    "Depression",
    "Anxiety",
    "Intelligence",
    "Memory",
    "Consciousness"
  ],

  // Literature (10)
  literature: [
    "William_Shakespeare",
    "Jane_Austen",
    "Harry_Potter",
    "The_Lord_of_the_Rings",
    "Don_Quixote",
    "War_and_Peace",
    "One_Thousand_and_One_Nights",
    "Divine_Comedy",
    "The_Bible",
    "Mahabharata"
  ],

  // Art & Culture (10)
  art: [
    "Leonardo_da_Vinci",
    "Pablo_Picasso",
    "Vincent_van_Gogh",
    "Mona_Lisa",
    "The_Starry_Night",
    "Graffiti",
    "Photography",
    "Sculpture",
    "Renaissance_art",
    "Modern_art"
  ],

  // Politics & Government (10)
  politics: [
    "Democracy",
    "Republicanism",
    "Monarchy",
    "Communism",
    "Liberalism",
    "Conservatism",
    "United_Nations",
    "European_Union",
    "NATO",
    "Constitutional_law"
  ],

  // Business & Entrepreneurship (10)
  business: [
    "Business",
    "Entrepreneurship",
    "Startup_company",
    "Venture_capital",
    "Business_model",
    "Marketing",
    "Supply_chain",
    "Project_management",
    "Strategic_management",
    "Mergers_and_acquisitions"
  ],

  // Gaming (10)
  gaming: [
    "Video_game",
    "Minecraft",
    "Fortnite",
    "League_of_Legends",
    "Chess",
    "Poker",
    "Virtual_reality",
    "Esports",
    "Game_design",
    "Console_gaming"
  ],

  // Food & Cooking (10)
  food: [
    "Cuisine",
    "Italian_cuisine",
    "Chinese_cuisine",
    "French_cuisine",
    "Sushi",
    "Pizza",
    "Bread",
    "Wine",
    "Coffee",
    "Tea"
  ],

  // Travel (10)
  travel: [
    "Tourism",
    "Paris",
    "New_York_City",
    "Tokyo",
    "London",
    "Rome",
    "Sydney_Opera_House",
    "Great_Wall_of_China",
    "Machu_Picchu",
    "Taj_Mahal"
  ],

  // Music (10)
  music: [
    "Music",
    "Jazz",
    "Rock_music",
    "Classical_music",
    "Hip_hop",
    "Electronic_dance_music",
    "Mozart",
    "The_Beatles",
    "Bach",
    "Ludwig_van_Beethoven"
  ],

  // Movies & Television (10)
  movies: [
    "Film",
    "The_Godfather",
    "Star_Wars",
    "Marvel_Cinematic_Universe",
    "Netflix",
    "Academy_Award",
    "Documentary",
    "Animation",
    "Horror_film",
    "Science_fiction_film"
  ],

  // Social Media & Internet (10)
  internet: [
    "Social_media",
    "Facebook",
    "Twitter",
    "Instagram",
    "YouTube",
    "TikTok",
    "Internet",
    "Email",
    "Online_shopping",
    "E-commerce"
  ],

  // Law (10)
  law: [
    "Law",
    "Criminal_law",
    "Contract_law",
    "International_law",
    "Human_rights",
    "Civil_law",
    "Common_law",
    "Constitutional_law",
    "Corporate_law",
    "Patent"
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
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ApexSearchEngine/1.0 (https://github.com/your-repo; contact@example.com) WikipediaBot/1.0"
      }
    });
    
    if (!response.ok) {
      console.log(`  ⚠️  API error for ${title}: ${response.status}`);
      return null;
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      console.log(`  ⚠️  Non-JSON response for ${title}`);
      return null;
    }
    
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
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Save all documents to persistence
  console.log("\n💾 Saving to persistence...");
  saveDocuments(existingDocs);
  
  // Save to PostgreSQL
  console.log("💾 Saving to PostgreSQL...");
  await saveDocumentsToCloud();
  
  // Rebuild Trie with all documents
  console.log("🌳 Building autocomplete Trie...");
  const allDocs = invertedIndex.getAllDocuments();
  const docsArray = Array.from(allDocs.values());
  trie.buildFromDocuments(docsArray, (text: string) => tokenizer(text), extractPhrases);
  
  console.log("\n" + "=".repeat(50));
  console.log("✅ Bulk import complete!");
  console.log(`   Successfully imported: ${successCount}`);
  console.log(`   Skipped: ${skipCount}`);
  console.log(`   Total documents: ${existingDocs.length}`);
  console.log("=".repeat(50));
}

// Run the import
bulkImport().catch(console.error);

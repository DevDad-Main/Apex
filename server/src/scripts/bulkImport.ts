/**
 * @fileoverview Unified Data Importer
 * 
 * Fetches data from multiple sources:
 * - Wikipedia (encyclopedia articles)
 * - GitHub (trending repositories)
 * - Stack Overflow (programming questions)
 * - Hacker News (tech stories)
 * - Open Library (books)
 * - Public APIs (countries, holidays, jokes)
 * - Dev.to (developer articles)
 * - Reddit (popular posts)
 * 
 * Usage: 
 *   npx tsx src/scripts/bulkImport.ts          # Run all importers
 *   npx tsx src/scripts/bulkImport.ts wiki      # Wikipedia only
 *   npx tsx src/scripts/bulkImport.ts github    # GitHub only
 *   npx tsx src/scripts/bulkImport.ts stats     # Show stats
 * 
 * @module scripts/bulkImport
 */

import "dotenv/config";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { loadDocuments, saveDocuments, saveDocumentsToCloud } from "../scraper/persistence.js";

interface ScrapedDoc {
  id: string;
  url: string;
  title: string;
  content: string;
  scrapedAt: string;
}

type ImportSource = "wiki" | "github" | "stackoverflow" | "hackernews" | "openlibrary" | "publicapi" | "devto" | "reddit" | "all";

// ==================== CONFIG ====================
const WIKIPEDIA_TOPICS: Record<string, string[]> = {
  programming: ["Python","JavaScript","TypeScript","Java","C++","C_Sharp","Go","Rust","Ruby","PHP","Swift","Kotlin","Scala","R","Perl","Lua","Haskell","Clojure","Elixir","Dart","Groovy","Julia","Objective-C","Fortran","COBOL","Lisp","HTML","CSS","HTTP","HTTPS","REST","GraphQL","JSON","XML","AJAX","WebSocket","DOM","Web_development","Web_application","API","Microservices"],
  frameworks: ["React","Vue","Angular","Svelte","Next.js","Nuxt.js","Gatsby","Remix","SolidJS","jQuery","Backbone","Ember","Meteor","React_Native","Flutter","Ionic","Electron","Node.js","Express","Django","Flask","Rails","Laravel","Spring","FastAPI","NestJS","Koa","Ruby","Python","Java","Go","Rust"],
  databases: ["Database","SQL","NoSQL","MongoDB","PostgreSQL","MySQL","MariaDB","SQLite","Redis","Elasticsearch","Cassandra","CouchDB","Neo4j","Oracle","SQL_Server","DynamoDB","Firebase","Supabase","CockroachDB","TimescaleDB","InfluxDB","ClickHouse","Big_data","Data_warehouse"],
  devops: ["DevOps","Docker","Kubernetes","Git","GitHub","GitLab","Bitbucket","CI_CD","Jenkins","GitHub_Actions","CircleCI","AWS","Azure","Google_Cloud","Heroku","DigitalOcean","Vercel","Netlify","Terraform","Ansible","Chef","Puppet","Helm","Istio","Prometheus","Grafana"],
  ai_ml: ["Artificial_intelligence","Machine_learning","Deep_learning","Neural_network","Computer_vision","NLP","Reinforcement_learning","Supervised_learning","ChatGPT","LLM","GPT","BERT","Transformer","CNN","RNN","LSTM","GAN","TensorFlow","PyTorch","Keras","Scikit-learn","XGBoost","Hugging_Face","OpenAI","DeepMind","Data_science","Data_mining"],
  security: ["Computer_security","Cybersecurity","Encryption","Cryptography","RSA","AES","TLS","SSL","SQL_injection","XSS","CSRF","Malware","Phishing","Authentication","OAuth","JWT","MFA","SSO","Firewall","VPN","Penetration_testing","OWASP"],
  science: ["Physics","Quantum_mechanics","Relativity","Thermodynamics","Electromagnetism","Particle_physics","Cosmology","Astrophysics","Chemistry","Periodic_table","Atom","DNA","RNA","Protein","Cell","Genetics","Evolution","Climate_change","Global_warming","Renewable_energy"],
  space: ["Astronomy","Solar_System","Sun","Mercury","Venus","Earth","Mars","Jupiter","Saturn","Uranus","Neptune","Moon","Galaxy","Black_hole","Big_Bang","Universe","NASA","SpaceX","ISS","Astronaut"],
  history: ["World_War_I","World_War_II","Cold_War","French_Revolution","American_Revolution","Industrial_Revolution","Renaissance","Middle_Ages","Ancient_Egypt","Ancient_Greece","Ancient_Rome","Mesopotamia","Roman_Empire"],
  health: ["COVID-19","Vaccine","Cancer","Diabetes","Mental_health","Heart_disease","Stroke","Brain","Heart","Liver","Kidney","Immune_system","Antibiotic","Nutrition","Exercise","Yoga","Meditation"],
  business: ["Stock_market","Cryptocurrency","Bitcoin","Ethereum","Investment","Banking","Marketing","Entrepreneurship","Startup","Venture_capital","GDP","Inflation","International_trade"],
  philosophy: ["Philosophy","Existentialism","Stoicism","Karl_Marx","Immanuel_Kant","Plato","Aristotle","Nietzsche","Sartre","Socrates","Descartes","Logic","Ethics","Metaphysics"],
  psychology: ["Psychology","Cognitive_psychology","Freud","Depression","Anxiety","Bipolar","Schizophrenia","Intelligence","Memory","Consciousness","Emotion","Learning"],
  literature: ["Shakespeare","Jane_Austen","Mark_Twain","Charles_Dickens","Ernest_Hemingway","George_Orwell","Harry_Potter","Lord_of_the_Rings","Don_Quixote","War_and_Peace","Iliad","Odyssey"],
  music: ["Music","Jazz","Rock","Classical_music","Hip_hop","EDM","Mozart","Beatles","Bach","Beethoven","Michael_Jackson","Spotify","Apple_Music"],
  movies: ["Film","The_Godfather","Star_Wars","Marvel","Netflix","Academy_Award","Animation","Horror","Sci_fi","Disney","Pixar","HBO","Prime_Video"],
  gaming: ["Video_game","Minecraft","Fortnite","League_of_Legends","Chess","VR","Esports","PlayStation","Xbox","Nintendo","Steam","World_of_Warcraft","Call_of_Duty"],
  countries: ["United_States","United_Kingdom","France","Germany","Italy","Spain","Russia","China","Japan","India","Brazil","Canada","Mexico","Australia","Egypt","South_Africa","Nigeria","South_Korea","Indonesia","Thailand","Vietnam","Turkey","Greece","Netherlands","Sweden","Norway"],
  travel: ["Paris","New_York","Tokyo","London","Rome","Sydney","Barcelona","Dubai","Singapore","Berlin","Madrid","Amsterdam","Bangkok","Mumbai","Cairo","Sydney_Opera_House","Great_Wall","Machu_Picchu","Taj_Mahal","Eiffel_Tower","Colosseum","Statue_of_Liberty","Golden_Gate"],
  food: ["Cuisine","Italian_cuisine","Chinese_cuisine","French_cuisine","Japanese_cuisine","Indian_cuisine","Mexican_cuisine","Thai_cuisine","Sushi","Pizza","Burger","Pasta","Bread","Rice","Tea","Coffee","Wine","Beer","Chocolate"],
  sports: ["Football","Basketball","Baseball","Soccer","Tennis","Olympics","Cricket","Golf","Swimming","Marathon","NBA","NFL","FIFA","World_Cup"],
  famous: ["Leonardo_da_Vinci","Pablo_Picasso","Van_Gogh","Albert_Einstein","Isaac_Newton","Stephen_Hawking","Nikola_Tesla","Thomas_Edison","Marie_Curie","Bill_Gates","Steve_Jobs","Elon_Musk","Mark_Zuckerberg","Barack_Obama","Abraham_Lincoln","Martin_Luther_King_Jr","Mahatma_Gandhi","Nelson_Mandela"]
};

const importedDocs: ScrapedDoc[] = [];

// ==================== HELPERS ====================
function createDoc(title: string, content: string, url: string, category: string): ScrapedDoc {
  const doc = {
    id: uuidv4(),
    url,
    title,
    content,
    scrapedAt: new Date().toISOString()
  };
  importedDocs.push(doc);
  return doc;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i < retries - 1) await delay(1000 * (i + 1));
    }
  }
  return null;
}

// ==================== IMPORTERS ====================
async function importWikipedia(): Promise<number> {
  console.log("📚 Importing Wikipedia articles...");
  let count = 0;
  const topics = Object.values(WIKIPEDIA_TOPICS).flat();

  for (const topic of topics) {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext&titles=${topic}&format=json&origin=*`;
      const res = await axios.get(url, { timeout: 10000 });
      const pages = res.data?.query?.pages;
      
      if (pages) {
        const page = pages[Object.keys(pages)[0]];
        if (page?.extract) {
          createDoc(
            page.title.replace(/_/g, " "),
            page.extract.substring(0, 20000),
            `https://en.wikipedia.org/wiki/${topic}`,
            "Wikipedia"
          );
          count++;
        }
      }
    } catch (e) { /* skip */ }
    
    await delay(100);
    if (count % 50 === 0) console.log(`   ✅ ${count} articles...`);
  }

  console.log(`   ✅ Wikipedia: ${count} articles`);
  return count;
}

async function importGitHub(): Promise<number> {
  console.log("🐙 Importing GitHub trending repos...");
  const languages = ["javascript", "typescript", "python", "rust", "go", "java"];
  let count = 0;

  for (const lang of languages) {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    
    const res = await fetchWithRetry(() => axios.get(
      `https://api.github.com/search/repositories?q=created:>${date.toISOString().split("T")[0]}&sort=stars&order=desc&per_page=30`,
      { headers: { "User-Agent": "ApexSearch" }, timeout: 15000 }
    ));

    if (res?.data?.items) {
      for (const repo of res.data.items) {
        createDoc(
          `${repo.name} - ${repo.language || "Code"}`,
          `${repo.description || "No description"}\n\nLanguage: ${repo.language}\nStars: ${repo.stargazers_count}\nForks: ${repo.forks_count}\nOwner: ${repo.owner?.login}`,
          repo.html_url,
          "GitHub"
        );
        count++;
      }
    }
    await delay(500);
  }

  console.log(`   ✅ GitHub: ${count} repos`);
  return count;
}

async function importStackOverflow(): Promise<number> {
  console.log("📌 Importing Stack Overflow...");
  const tags = ["javascript", "python", "java", "typescript", "react", "node.js", "sql", "docker", "git", "css"];

  for (const tag of tags) {
    const res = await fetchWithRetry(() => axios.get(
      `https://api.stackexchange.com/2.3/questions?order=desc&sort=activity&tagged=${tag}&pagesize=25&filter=withbody`
    ));

    if (res?.data?.items) {
      for (const q of res.data.items) {
        createDoc(
          q.title,
          `${q.title}\n\nTags: ${q.tags?.join(", ")}\nScore: ${q.score}\nAnswers: ${q.answer_count}\n${(q.body || "").substring(0, 2000)}`,
          q.link,
          "StackOverflow"
        );
      }
    }
    await delay(300);
  }

  console.log(`   ✅ Stack Overflow: ${importedDocs.filter(d => d.category === "StackOverflow").length} questions`);
  return importedDocs.filter(d => d.category === "StackOverflow").length;
}

async function importHackerNews(): Promise<number> {
  console.log("📰 Importing Hacker News...");
  const types = ["top", "best", "new"];
  let count = 0;

  for (const type of types) {
    const idsRes = await fetchWithRetry(() => axios.get(
      `https://hacker-news.firebaseio.com/v0/${type}stories.json`
    ));

    if (idsRes?.data) {
      const ids = idsRes.data.slice(0, 30);
      for (const id of ids) {
        const item = await fetchWithRetry(() => axios.get(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`
        ));
        
        if (item?.data?.type === "story") {
          createDoc(
            item.data.title,
            `${item.data.title}\n\nBy: ${item.data.by}\nScore: ${item.data.score}\nComments: ${item.data.descendants}\nURL: ${item.data.url}`,
            item.data.url || `https://news.ycombinator.com/item?id=${id}`,
            "HackerNews"
          );
          count++;
        }
        await delay(50);
      }
    }
  }

  console.log(`   ✅ Hacker News: ${count} stories`);
  return count;
}

async function importOpenLibrary(): Promise<number> {
  console.log("📖 Importing Open Library...");
  const subjects = ["science", "technology", "history", "philosophy", "literature", "art", "music", "sports", "business", "fiction"];
  let count = 0;

  for (const subject of subjects) {
    const res = await fetchWithRetry(() => axios.get(
      `https://openlibrary.org/subjects/${subject}.json?limit=50`
    ));

    if (res?.data?.works) {
      for (const work of res.data.works) {
        createDoc(
          work.title,
          `Title: ${work.title}\nAuthor: ${work.authors?.[0]?.name}\nSubject: ${subject}`,
          `https://openlibrary.org${work.key}`,
          "Books"
        );
        count++;
      }
    }
    await delay(200);
  }

  console.log(`   ✅ Open Library: ${count} books`);
  return count;
}

async function importPublicAPIs(): Promise<number> {
  console.log("🌐 Importing public APIs...");
  let count = 0;

  // Countries
  const countriesRes = await fetchWithRetry(() => axios.get(
    "https://restcountries.com/v3.1/all?fields=name,capital,region,population,languages,currencies,flags"
  ));

  if (countriesRes?.data) {
    for (const c of countriesRes.data.slice(0, 100)) {
      const langs = Object.values(c.languages || {}).join(", ");
      const currs = Object.values(c.currencies || {}).map((x: any) => x.name).join(", ");
      createDoc(
        `${c.name?.common} - ${c.region}`,
        `${c.name?.common}\nCapital: ${c.capital?.[0]}\nRegion: ${c.region}\nPopulation: ${c.population?.toLocaleString()}\nLanguages: ${langs}\nCurrency: ${currs}`,
        `https://restcountries.com/v3.1/name/${c.name?.common}`,
        "Geography"
      );
      count++;
    }
  }

  // Jokes
  const jokeCats = ["programming", "misc", "pun"];
  for (const cat of jokeCats) {
    for (let i = 0; i < 5; i++) {
      const jokeRes = await fetchWithRetry(() => axios.get(`https://v2.jokeapi.dev/joke/${cat}?type=single`));
      if (jokeRes?.data?.joke) {
        createDoc(`Joke: ${cat}`, jokeRes.data.joke, `https://v2.jokeapi.dev/joke/${cat}`, "Entertainment");
        count++;
      }
    }
  }

  console.log(`   ✅ Public APIs: ${count} items`);
  return count;
}

async function importDevTo(): Promise<number> {
  console.log("💻 Importing Dev.to...");
  const tags = ["javascript", "python", "react", "typescript", "docker", "webdev", "beginners", "tutorial"];
  let count = 0;

  for (const tag of tags) {
    const res = await fetchWithRetry(() => axios.get(
      `https://dev.to/api/articles?tag=${tag}&per_page=15`
    ));

    if (res?.data) {
      for (const a of res.data) {
        createDoc(
          a.title,
          `${a.title}\n\nBy: ${a.user?.name}\nReactions: ${a.public_reactions_count}\nTags: ${a.tag_list?.join(", ")}\n${a.description || ""}`,
          a.url,
          "DevTo"
        );
        count++;
      }
    }
    await delay(300);
  }

  console.log(`   ✅ Dev.to: ${count} articles`);
  return count;
}

async function importReddit(): Promise<number> {
  console.log("🔺 Importing Reddit...");
  const subs = ["technology", "programming", "science", "gaming", "business"];
  let count = 0;

  for (const sub of subs) {
    const res = await fetchWithRetry(() => axios.get(
      `https://www.reddit.com/r/${sub}/hot.json?limit=20`,
      { headers: { "User-Agent": "ApexSearch/1.0" } }
    ));

    if (res?.data?.data?.children) {
      for (const p of res.data.data.children) {
        const post = p.data;
        if (post?.selftext?.length > 30) {
          createDoc(
            post.title,
            `r/${sub}: ${post.title}\n\nScore: ${post.score}\nComments: ${post.num_comments}\n${post.selftext.substring(0, 1500)}`,
            `https://reddit.com${post.permalink}`,
            "Reddit"
          );
          count++;
        }
      }
    }
    await delay(500);
  }

  console.log(`   ✅ Reddit: ${count} posts`);
  return count;
}

// ==================== MAIN ====================
async function runImport(source?: ImportSource): Promise<number> {
  importedDocs.length = 0;
  
  const existingDocs = loadDocuments();
  const existingUrls = new Set(existingDocs.map(d => d.url));
  console.log(`📄 Existing documents: ${existingDocs.length}\n`);

  const importers: { name: string; fn: () => Promise<number> }[] = [
    { name: "Wikipedia", fn: importWikipedia },
    { name: "GitHub", fn: importGitHub },
    { name: "Stack Overflow", fn: importStackOverflow },
    { name: "Hacker News", fn: importHackerNews },
    { name: "Open Library", fn: importOpenLibrary },
    { name: "Public APIs", fn: importPublicAPIs },
    { name: "Dev.to", fn: importDevTo },
    { name: "Reddit", fn: importReddit },
  ];

  const sourcesToRun = source && source !== "all" 
    ? importers.filter(i => i.name.toLowerCase().includes(source))
    : importers;

  for (const { name, fn } of sourcesToRun) {
    try {
      await fn();
      await delay(500);
    } catch (e) {
      console.log(`   ⚠️  ${name} failed`);
    }
  }

  // Filter duplicates
  const uniqueDocs = importedDocs.filter(d => !existingUrls.has(d.url));

  // Save
  for (const doc of uniqueDocs) {
    existingDocs.push({
      id: doc.id,
      url: doc.url,
      title: doc.title,
      content: doc.content,
      scrapedAt: doc.scrapedAt
    });
  }

  saveDocuments(existingDocs);
  
  try {
    await saveDocumentsToCloud();
  } catch (e) { /* skip */ }

  return uniqueDocs.length;
}

function showStats(): void {
  const docs = loadDocuments();
  console.log(`\n📊 Total documents: ${docs.length}\n`);
  
  const categoryCount: Record<string, number> = {};
  for (const doc of docs) {
    const url = doc.url;
    let cat = "Other";
    if (url.includes("wikipedia")) cat = "Wikipedia";
    else if (url.includes("github")) cat = "GitHub";
    else if (url.includes("stackoverflow")) cat = "StackOverflow";
    else if (url.includes("hacker-news")) cat = "HackerNews";
    else if (url.includes("openlibrary")) cat = "Books";
    else if (url.includes("dev.to")) cat = "DevTo";
    else if (url.includes("reddit")) cat = "Reddit";
    else if (url.includes("restcountries")) cat = "Geography";
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  }

  console.log("By source:");
  for (const [cat, count] of Object.entries(categoryCount)) {
    console.log(`  ${cat}: ${count}`);
  }
  console.log("");
}

// CLI
const arg = process.argv[2] as ImportSource;

if (arg === "stats") {
  showStats();
} else {
  console.log("🚀 Starting data import...\n");
  console.log("=".repeat(50));
  
  runImport(arg).then(count => {
    console.log("\n" + "=".repeat(50));
    console.log(`✅ Import complete! Added ${count} new documents.`);
    console.log("=".repeat(50));
    showStats();
  }).catch(console.error);
}

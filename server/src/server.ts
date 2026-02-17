import "dotenv/config";
import { logger } from "devdad-express-utils";
import app from "./app.js";
import { invertedIndex } from "./index/invertedIndex.js";
import { loadDocumentsFromCloud } from "./scraper/persistence.js";
import { prisma } from "./lib/prisma.js";
import { trie } from "./autocomplete/trie.js";
import tokenizer, { extractPhrases } from "./textProcessor/tokenizer.js";
import { initializeRedisClient } from "./utils/redis.utils.js";

await prisma.$connect();
logger.info("Connected to PostgreSQL");

const PORT = process.env.PORT || 8000;

(async () => {
  try {
    // Load documents from PostgreSQL
    const docs = await loadDocumentsFromCloud();
    logger.info(`Loading ${docs.length} documents into search index...`);

    // Add each document to the inverted index
    for (const doc of docs) {
      invertedIndex.addDocument({
        id: doc.id,
        url: doc.url,
        title: doc.title,
        content: doc.content,
      });
    }

    // Rebuild sorted terms for binary search
    invertedIndex.rebuildSortedTerms();

    // Build autocomplete Trie from all documents
    const allDocs = invertedIndex.getAllDocuments();
    const docsArray = Array.from(allDocs.values());
    trie.buildFromDocuments(docsArray, (text: string) => tokenizer(text), extractPhrases);
    logger.info(`Built autocomplete trie with ${docsArray.length} documents`);

    await initializeRedisClient();
    logger.info("Redis client initialized");

    // Start the server
    app.listen(PORT, () => {
      logger.info(`🚀 Apex search engine running on port ${PORT}`);
      logger.info(`📊 Database: PostgreSQL (Neon)`);
    });

    // logger.info("Find closes term using levenshtein..");
    // logger.info(`Levenshtein result is...${findClosestTerm("pythn")}`);

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      logger.info("SIGTERM received, shutting down gracefully");
      await prisma.$disconnect();
      process.exit(0);
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
})();

process.on("unhandledRejection", (reason, p) => {
  logger.error("Unhandled Rejection at:", { reason, p });
  process.exit(1);
});

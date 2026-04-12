import "dotenv/config";
import { logger } from "devdad-express-utils";
import app from "./app.js";
import { invertedIndex } from "./index/invertedIndex.js";
import { loadDocumentsFromCloud } from "./scraper/persistence.js";
import { prisma } from "./lib/prisma.js";
import { trie } from "./autocomplete/trie.js";
import tokenizer, { extractPhrases } from "./textProcessor/tokenizer.js";
import { initializeRedisClient } from "./utils/redis.utils.js";
import { termCooccurrenceGraph } from "./graph/termCooccurrenceGraph.js";
import {
  documentSimilarity,
  SimiliarDoc,
} from "./similarity/documentSimiliarity.js";

await prisma.$connect();
logger.info("Connected to PostgreSQL");

const PORT = process.env.PORT || 8000;
const TOP_K = 10;
const USE_PG_SEARCH = process.env.USE_PG_SEARCH === "true";
let docsArray: any = [];

(async () => {
  try {
    // Load documents from PostgreSQL
    const docs = await loadDocumentsFromCloud();
    // logger.info(`Loading ${docs.length} documents into search index...`);

    logger.info(`USE_PG_SEARCH value: ${USE_PG_SEARCH}`);

    if (USE_PG_SEARCH) {
      // Don't add to invertedIndex  - Skip it entirely
      // Just use for trie + graph building.
      docsArray = docs
        .map((doc) => ({
          id: doc.id,
          url: doc.url,
          title: doc.title,
          content: doc.content,
        }))
        .filter((doc) => typeof doc.title === "string");

      trie.buildFromDocuments(
        docsArray,
        (text: string) => tokenizer(text),
        extractPhrases,
      );

      termCooccurrenceGraph.buildFromDocuments(docsArray);
    } else {
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

      docsArray = Array.from(allDocs.values()).filter(
        (
          doc,
        ): doc is { id: string; url: string; content: string; title: string } =>
          typeof doc.title === "string",
      );

      trie.buildFromDocuments(
        docsArray,
        (text: string) => tokenizer(text),
        extractPhrases,
      );

      // NOTE: Initialize Graph
      termCooccurrenceGraph.buildFromDocuments(docsArray);

      logger.info(`Built term co-occurrence graph`);
      logger.info(`Built autocomplete trie with ${docsArray.length} documents`);
    }

    // Check if similarity data already exists in Redis
    const client = await initializeRedisClient();
    const cached = await client.get("similar:indexBuilt");

    if (cached) {
      logger.info("Similarity index already exists in Redis, skipping rebuild");
    } else {
      const similarityMap = documentSimilarity.buildAllSimilarities(
        docsArray,
        TOP_K,
        (current, total) => {
          logger.info(`Similarity progress: ${current}/${total}`);
        },
      );

      // NOTE: Build Document similarity index
      logger.info(
        `Building similarity index for ${docsArray.length} documents...`,
      );

      logger.info(`Built similarity index for ${docsArray.length} documents`);

      // Store in Redis
      for (const [docId, similarDocs] of similarityMap) {
        await client.set(`similar:${docId}`, JSON.stringify(similarDocs));
      }

      // Mark as built
      await client.set(
        "similar:indexBuilt",
        JSON.stringify({ builtAt: Date.now() }),
      );
    }

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

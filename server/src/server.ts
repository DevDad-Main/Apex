import "dotenv/config";
import { connectDB, getDBStatus, logger } from "devdad-express-utils";
import app from "./app.js";
import { invertedIndex } from "./index/invertedIndex.js";
import { loadDocumentsFromCloud } from "./scraper/persistence.js";
import { trie } from "./autocomplete/trie.js";
import tokenizer from "./textProcessor/tokenizer.js";

await connectDB();

const PORT = process.env.PORT || 8000;
const dbStatus = getDBStatus();

(async () => {
  try {
    // Load documents from MongoDB
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
    trie.buildFromDocuments(docsArray, (text: string) => tokenizer(text));
    logger.info(`Built autocomplete trie with ${docsArray.length} documents`);

    // Start the server
    app.listen(PORT, () => {
      logger.info(`🚀 Apex search engine running on port ${PORT}`);
      logger.info(`📊 Database status: `, { dbStatus });
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received, shutting down gracefully");
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

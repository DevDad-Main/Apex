import "dotenv/config";
import { connectDB, getDBStatus, logger } from "devdad-express-utils";
import app from "./app.js";
import { invertedIndex } from "./index/invertedIndex.js";
import { loadDocuments, saveDocumentsToCloud } from "./scraper/persistence.js";
import { trie } from "./autocomplete/trie.js";
import tokenizer from "./textProcessor/tokenizer.js";

const PORT = process.env.PORT || 8000;

await connectDB();

(async () => {
  try {
    // Load persisted documents and build indexes
    const docs = loadDocuments();
    logger.info(`Loading ${docs.length} persisted documents...`);

    for (const doc of docs) {
      invertedIndex.addDocument({
        id: doc.id,
        url: doc.url,
        title: doc.title,
        content: doc.content,
      });
    }

    // Build the autocomplete trie from all documents
    const allDocs = invertedIndex.getAllDocuments();
    const docsArray = Array.from(allDocs.values());
    trie.buildFromDocuments(docsArray, (text: string) => tokenizer(text));
    logger.info(`Built autocomplete trie with ${docsArray.length} documents`);

    logger.info(`Saving Parsed Data to MongoDB`);
    await saveDocumentsToCloud();

    app.listen(PORT, () => {
      logger.info(`Apex backend is running on port ${PORT}`);
      logger.info(`DB Status: `, getDBStatus());
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received, shutting down gracefully");
      process.exit(0);
    });
  } catch (error) {
    logger.error("Failed to connect to server..", { error });
    process.exit(1);
  }
})();

process.on("unhandledRejection", (reason, p) => {
  logger.error("Unhandled Rejection at: Promise", { reason, p });
  process.exit(1);
});

import * as fs from "fs";
import { Document } from "@/models/Document.model.js";
import * as path from "path";
import { fileURLToPath } from "url";
import { logger } from "devdad-express-utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "../../data");
const DATA_FILE = path.join(DATA_DIR, "scraped-pages.json");

interface StoredData {
  documents: any[];
}

/**
 * Ensures data directory exists before I/O operations
 */
function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Load documents from JSON file (local fallback)
 */
export function loadDocuments(): any[] {
  ensureDir();

  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }

  const data: StoredData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  return data.documents || [];
}

/**
 * Save documents to JSON file (local fallback)
 */
export function saveDocuments(documents: any[]): void {
  ensureDir();
  const data: StoredData = { documents };
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

/**
 * Save documents to MongoDB with deduplication by URL
 */
export async function saveDocumentsToCloud(): Promise<void> {
  const data = loadDocuments();

  // Deduplicate by URL using Map
  const uniqueDocs = new Map<string, any>();

  for (const doc of data) {
    if (doc.url) {
      uniqueDocs.set(doc.url, doc);
    }
  }

  logger.info(`Unique documents after deduplication: ${uniqueDocs.size}`);

  try {
    const documents = Array.from(uniqueDocs.values());

    for (const doc of documents) {
      await Document.findOneAndUpdate(
        { url: doc.url },
        { $set: doc },
        { upsert: true, returnDocument: "after" }
      );
    }

    logger.info(`Successfully saved ${documents.length} documents to MongoDB`);
  } catch (error: any) {
    logger.error("Failed to save documents to MongoDB", { error });
    throw error;
  }
}

/**
 * Load documents from MongoDB
 */
export async function loadDocumentsFromCloud(): Promise<any[]> {
  try {
    logger.info(`Fetching documents from MongoDB...`);
    const documents = await Document.find({}).lean();
    logger.info(`Successfully fetched ${documents.length} documents`);

    return documents.map((doc) => ({
      id: doc._id.toString(),
      url: doc.url,
      title: doc.title,
      content: doc.content,
    }));
  } catch (error) {
    logger.error(`Failed to fetch documents from MongoDB`, { error });
    throw error;
  }
}

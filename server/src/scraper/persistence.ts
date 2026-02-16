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
  document: any;
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
 * Load documents from JSON file.
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
 * Save documents to JSON file.
 */
export function saveDocuments(documents: any[]): void {
  ensureDir();
  const data: StoredData = { documents };
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function saveDocumentsToCloud(): Promise<void> {
  const data: any = loadDocuments();

  // De-duplicate by URL using Map
  const uniqueDocs = new Map<string, any>();

  for (const doc of data) {
    // Key by URL - automatically overwrites duplicates
    if (doc.url) {
      uniqueDocs.set(doc.url, doc);
    }
  }

  logger.info(`Unique documents after de-duplication: ${uniqueDocs.size}`);

  try {
    // Convert Map values to array and insert
    const documents = Array.from(uniqueDocs.values());

    for (const doc of documents) {
      await Document.create({
        title: doc.title,
        content: doc.content,
        url: doc.url,
      });
    }
    logger.info(`Successfully inserted ${documents.length} documents`);
  } catch (error: any) {
    logger.error("Failed to insert document..", { error });
    throw error;
  }
}

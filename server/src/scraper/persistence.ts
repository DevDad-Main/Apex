import * as fs from "fs";
import { prisma } from "../lib/prisma.js";
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

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadDocuments(): any[] {
  ensureDir();

  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }

  const data: StoredData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  return data.documents || [];
}

export function saveDocuments(documents: any[]): void {
  ensureDir();
  const data: StoredData = { documents };
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function saveDocumentsToCloud(): Promise<void> {
  const data = loadDocuments();

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
      await prisma.document.upsert({
        where: { url: doc.url },
        update: {
          title: doc.title,
          content: doc.content,
          scrapedAt: doc.scrapedAt ? new Date(doc.scrapedAt) : new Date(),
        },
        create: {
          title: doc.title,
          content: doc.content,
          url: doc.url,
          scrapedAt: doc.scrapedAt ? new Date(doc.scrapedAt) : new Date(),
        },
      });
    }

    logger.info(`Successfully saved ${documents.length} documents to PostgreSQL`);
  } catch (error: any) {
    logger.error("Failed to save documents to PostgreSQL", { error });
    throw error;
  }
}

export async function loadDocumentsFromCloud(): Promise<any[]> {
  try {
    logger.info(`Fetching documents from PostgreSQL...`);
    const documents = await prisma.document.findMany({
      orderBy: { createdAt: "desc" },
    });
    logger.info(`Successfully fetched ${documents.length} documents`);

    return documents.map((doc) => ({
      id: doc.id,
      url: doc.url,
      title: doc.title,
      content: doc.content,
    }));
  } catch (error) {
    logger.error(`Failed to fetch documents from PostgreSQL`, { error });
    throw error;
  }
}

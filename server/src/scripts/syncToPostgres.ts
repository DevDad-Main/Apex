/**
 * @fileoverview Simple sync script to push all local documents to PostgreSQL
 * 
 * Usage: npx tsx src/scripts/syncToPostgres.ts
 * 
 * @module scripts/syncToPostgres
 */

import "dotenv/config";
import { prisma } from "../lib/prisma.js";
import { loadDocuments } from "../scraper/persistence.js";
import { logger } from "devdad-express-utils";

async function syncToPostgres() {
  console.log("🚀 Syncing local documents to PostgreSQL...\n");

  // Load all local documents
  const docs = loadDocuments();
  console.log(`📄 Local documents: ${docs.length}`);

  if (docs.length === 0) {
    console.log("❌ No local documents found!");
    return;
  }

  // Clear existing PostgreSQL documents
  console.log("🗑️  Clearing existing PostgreSQL documents...");
  await prisma.document.deleteMany({});

  // Prepare documents for bulk insert
  const documents = docs.map(doc => ({
    url: doc.url,
    title: doc.title,
    content: doc.content,
    scrapedAt: doc.scrapedAt ? new Date(doc.scrapedAt) : new Date(),
  }));

  console.log(`💾 Inserting ${documents.length} documents...`);

  // Bulk insert (in batches)
  const batchSize = 500;
  let inserted = 0;

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    
    await prisma.document.createMany({
      data: batch,
      skipDuplicates: true,
    });

    inserted += batch.length;
    console.log(`   ✅ Inserted ${inserted}/${documents.length}`);
  }

  // Verify
  const count = await prisma.document.count();
  
  console.log("\n" + "=".repeat(50));
  console.log(`✅ Sync complete!`);
  console.log(`   PostgreSQL now has: ${count} documents`);
  console.log("=".repeat(50));
}

syncToPostgres()
  .catch(console.error)
  .finally(() => process.exit());

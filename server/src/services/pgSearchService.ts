import { prisma } from "../lib/prisma.js";
import { Document } from "../generated/client.js";

const docsUnsafeQuery = `
      SELECT id, url, title, content, ts_rank("contentVector", plainto_tsquery('english', $1)) as rank
      FROM "Document"
      WHERE "contentVector" @@ plainto_tsquery('english', $1)
      ORDER BY rank DESC
      LIMIT $2 OFFSET $3
    `;

const totalResultsUnsafeQuery = `
      SELECT COUNT(*)::int as count
      FROM "Document"
      WHERE "contentVector" @@ plainto_tsquery('english', $1) 
    `;

interface DocumentInput {
  title: string;
  url: string;
  content: string;
  score: number;
  documentId: string;
}

class PGSearchService {
  async search(query: string, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    // the main search with tsvector ranking
    const docs: Document[] = await prisma.$queryRawUnsafe(
      docsUnsafeQuery,
      query,
      limit,
      offset,
    );

    // Get total count for pagination
    const totalResult: any = await prisma.$queryRawUnsafe(
      totalResultsUnsafeQuery,
      query,
    );

    const mappedResults = docs.map(
      (doc): DocumentInput => ({
        documentId: doc.id,
        // score: normalizeRank(doc.rank),
        score: doc.rank,
        title: doc.title,
        url: doc.url,
        content: doc.content,
      }),
    );

    console.log(`Mapped Results: `, mappedResults);

    const pagination = {
      total: totalResult[0].count,
      page,
      limit,
      totalPages: Math.ceil(totalResult[0].count / limit),
    };

    const response = {
      results: mappedResults,
      pagination,
    };

    return response;
  }
}

export const pgSearchService = new PGSearchService();

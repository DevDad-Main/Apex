import { getRedisClient } from "../utils/redis.utils.js";

export interface SimiliarDoc {
  id: string;
  title: string;
  url: string;
  similarityScore: number;
}

class SimilarityService {
  async getSimiliarDocuments(docId: string): Promise<SimiliarDoc[]> {
    const client = getRedisClient();
    const stored = await client.get(`similar:${docId}`);

    if (!stored) return [];

    return JSON.parse(stored);
  }

  async getSimiliarDocumentsForMany(docIds: string[]): Promise<Map<string, SimiliarDoc[]>> {
    const client = getRedisClient();
    const results = new Map<string, SimiliarDoc[]>();

    for (const docId of docIds) {
      const stored = await client.get(`similar:${docId}`);
      if (stored) {
        results.set(docId, JSON.parse(stored));
      }
    }

    return results;
  }
}

export const similarityService = new SimilarityService();

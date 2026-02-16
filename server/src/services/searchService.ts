import { trie } from "../autocomplete/trie.js";
import { invertedIndex } from "../index/invertedIndex.js";
import { initializeRedisClient } from "../utils/redis.utils.js";

class SearchService {
  async search(query: string) {
    try {
      const client = await initializeRedisClient();

      const cached = await client.get(`search:${query}`);
      if (cached) return JSON.parse(cached);
    } catch (error) {
      // Redis not available, continue without caching
    }

    const results = invertedIndex.search(query);

    const resultsWithDocs = results.map((result) => {
      const doc = invertedIndex.getDocument(result.documentId);
      return {
        documentId: result.documentId,
        score: result.score,
        title: doc?.title,
        url: doc?.url,
        content: doc?.content,
      };
    });

    try {
      const client = await initializeRedisClient();
      await client.set(`search:${query}`, JSON.stringify(resultsWithDocs), {
        EX: 300,
      });
    } catch (error) {
      // Redis not available, skip caching
    }

    return resultsWithDocs;
  }

  async autocomplete(query: string, limit: number) {
    return trie.getSuggestions(query, limit);
  }
}

export const searchService = new SearchService();

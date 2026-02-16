import { trie } from "../autocomplete/trie.js";
import { invertedIndex } from "../index/invertedIndex.js";
import { initializeRedisClient } from "../utils/redis.utils.js";

class SearchService {
  async search(query: string) {
    const client = await initializeRedisClient();

    // Check Cache First - parse the cached string back to an object
    const cached = await client.get(`search:${query}`);
    if (cached) return JSON.parse(cached);

    // Query Index
    const results = invertedIndex.search(query);

    const resultsWithDocs = results.map((result) => {
      const doc = invertedIndex.getDocument(result.documentId);

      return {
        documentId: result.documentId,
        score: result.score,
        // Also include the full document for FE.
        title: doc?.title,
        url: doc?.url,
        content: doc?.content,
      };
    });

    // Cache results - stringify the array data.
    // Also now cache the full resut doc so we send the whole data to the FE.
    await client.set(`search:${query}`, JSON.stringify(resultsWithDocs), {
      EX: 300,
    });
    return resultsWithDocs;
  }

  async autocomplete(query: string, limit: number) {
    // Trie is already fast in-memory, no need for Redis caching
    return trie.getSuggestions(query, limit);
  }
}

// Singleton
export const searchService = new SearchService();

import { trie } from "@/autocomplete/trie.js";
import { invertedIndex } from "@/index/invertedIndex.js";
import { initializeRedisClient } from "@/utils/redis.utils.js";
import { logger } from "devdad-express-utils";

class SearchService {
  async search(query: string) {
    const client = await initializeRedisClient();

    // Check Cache First - parse the cached string back to an object
    const cached = await client.get(`search:${query}`);
    if (cached) return JSON.parse(cached);

    // Query Index
    const results = invertedIndex.search(query);

    // Cache results - stringify the array data
    await client.set(`search:${query}`, JSON.stringify(results), { EX: 300 });
    return results;
  }

  async autocomplete(query: string, limit: number) {
    // Check Cache first
    const client = await initializeRedisClient();

    const cached = await client.get(`autocomplete:${query}`);
    if (cached) {
      logger.info(`Returning Cached Autocomplete data..`, { cached });
      return JSON.parse(cached);
    }

    const results = trie.getSuggestions(query, limit);
    await client.set(`autocomplete:${query}`, JSON.stringify(results), {
      EX: 600,
    });

    logger.info(`Caching Autocomplete Results..`, { results });
    return results;
  }
}

// Singleton
export const searchService = new SearchService();

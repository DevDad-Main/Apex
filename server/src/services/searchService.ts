import { trie } from "../autocomplete/trie.js";
import { invertedIndex } from "../index/invertedIndex.js";
import { getRedisClient } from "../utils/redis.utils.js";
import { searchHistoryService } from "./searchHistory.js";

class SearchService {
  async search(query: string, page = 1, limit = 10) {
    const cacheKey = `search:${query}:${page}:${limit}`;

    // Try to get from cache first - returns immediately if hit
    try {
      const client = getRedisClient();
      const cached = await client.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Redis not available, continue without cache
    }

    // Search the index
    const results = invertedIndex.search(query);

    // Get full documents for each result
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

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = resultsWithDocs.slice(startIndex, endIndex);

    const response = {
      results: paginatedResults,
      pagination: {
        total: results.length,
        page,
        limit,
        totalPages: Math.ceil(results.length / limit),
      },
    };

    // Cache the results for 5 minutes
    try {
      const client = getRedisClient();
      await client.set(cacheKey, JSON.stringify(response), { EX: 300 });
    } catch {
      // Redis not available, skip caching
    }

    return response;
  }

  // async autocomplete(query: string, limit = 10) {
  //   return trie.getSuggestions(query, limit);
  // }

  async autocomplete(query: string, limit = 10) {
    // Get trie suggestions (words + phrases)
    const trieSuggestions = trie.getSuggestions(query, limit * 2);

    // Get Popular searches from history
    const popularSearches = await searchHistoryService.getPopular(
      query,
      limit * 2,
    );

    // Merge and score
    const scored = [...trieSuggestions].map((term) => ({
      term,
      score: 0, // Base score from trie
    }));

    popularSearches.forEach((popular) => {
      const index = scored.findIndex((s) => s.term === popular.term);
      if (index >= 0) {
        scored[index].score += popular.count * 10; // History weight
      } else {
        scored.push({ term: popular.term, score: popular.count * 10 });
      }
    });

    // Sort by score, return top N
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.term);
  }

  async getRandom(limit = 10) {
    const docs = invertedIndex.getRandomDocuments(limit);
    return docs.map((doc) => ({
      documentId: doc.id,
      score: 0,
      title: doc.title,
      url: doc.url,
      content: doc.content,
    }));
  }
}

export const searchService = new SearchService();

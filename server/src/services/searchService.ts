import { trie } from "../autocomplete/trie.js";
import { invertedIndex } from "../index/invertedIndex.js";
import { getRedisClient } from "../utils/redis.utils.js";
import { searchHistoryService } from "./searchHistory.js";
import { MinHeap } from "../autocomplete/minHeap.js";
import { termCooccurrenceGraph } from "../graph/termCooccurrenceGraph.js";
import { similarityService, SimiliarDoc } from "./similarityService.js";

// Cache version - change this to bust old cache
const CACHE_VERSION = "v2";

class SearchService {
  //#region Search
  async search(query: string, page = 1, limit = 10) {
    const cacheKey = `search:${CACHE_VERSION}:${query}:${page}:${limit}`;

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
    // const results = invertedIndex.search(query);

    const expandedTerms = termCooccurrenceGraph.expandQuery(query);
    console.log(`Expanded Terms: `, expandedTerms);
    const expandedQuery = expandedTerms.join(" ");
    const results = invertedIndex.search(expandedQuery);

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

    // Get related documents for the top 3 results
    const topResults = results.slice(0, 3);
    const topDocIds = topResults.map((r) => r.documentId);
    const similarDocsMap = await similarityService.getSimiliarDocumentsForMany(topDocIds);

    // Aggregate and deduplicate related docs
    const relatedDocs: SimiliarDoc[] = [];
    const seenIds = new Set<string>();

    for (const docs of similarDocsMap.values()) {
      for (const doc of docs) {
        if (!seenIds.has(doc.id)) {
          seenIds.add(doc.id);
          relatedDocs.push(doc);
        }
      }
    }

    // Sort by score and limit to top 5
    const related = relatedDocs
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 5);

    const response = {
      results: paginatedResults,
      pagination: {
        total: results.length,
        page,
        limit,
        totalPages: Math.ceil(results.length / limit),
      },
      related,
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
  //#endregion

  //#region AutoComplete -> Old Sorting Method.
  // async autocomplete(query: string, limit = 10) {
  //   // Get trie suggestions (words + phrases)
  //   const trieSuggestions = trie.getSuggestions(query, limit * 2);
  //
  //   // Get Popular searches from history
  //   const popularSearches = await searchHistoryService.getPopular(
  //     query,
  //     limit * 2,
  //   );
  //
  //   // Merge and score
  //   const scored = [...trieSuggestions].map((term) => ({
  //     term,
  //     score: 0, // Base score from trie
  //   }));
  //
  //   popularSearches.forEach((popular) => {
  //     const index = scored.findIndex((s) => s.term === popular.term);
  //     if (index >= 0) {
  //       scored[index].score += popular.count * 10; // History weight
  //     } else {
  //       scored.push({ term: popular.term, score: popular.count * 10 });
  //     }
  //   });
  //
  //   // Sort by score, return top N
  //   return scored
  //     .sort((a, b) => b.score - a.score)
  //     .slice(0, limit)
  //     .map((s) => s.term);
  // }
  //#endregion

  //#region AutoComplete -> New Binary Heap for TOP-K
  async autocomplete(query: string, limit = 10) {
    // Get MORE candidates than before - new heap makes this efficient!
    // Previously: limit * 2 = 20
    // Now we can do limit * 10 = 100 (5x more candidates!)
    const candidateCount = limit * 10;

    // Get trie suggestions (words + phrases)
    const trieSuggestions = trie.getSuggestions(query, candidateCount);

    // Get popular searches from history
    const popularSearches = await searchHistoryService.getPopular(
      query,
      candidateCount,
    );

    // Build scored items array with deduplication
    const seenTerms = new Set<string>();
    const scored: { term: string; score: number }[] = [];

    for (const term of trieSuggestions) {
      const normalized = term.toLowerCase();
      if (!seenTerms.has(normalized)) {
        seenTerms.add(normalized);
        scored.push({ term, score: 0 });
      }
    }

    popularSearches.forEach((popular) => {
      const normalized = popular.term.toLowerCase();
      if (!seenTerms.has(normalized)) {
        seenTerms.add(normalized);
        scored.push({ term: popular.term, score: popular.count * 10 });
      }
    });

    // TOP-K WITH MIN HEAP
    // Higher score = "smaller" in heap (so root = worst of top-K)
    const topKHeap = new MinHeap<{ term: string; score: number }>(
      (a, b) => b.score - a.score,
    );

    for (const item of scored) {
      if (topKHeap.size < limit) {
        topKHeap.push(item);
      } else if (item.score > (topKHeap.peek()?.score ?? 0)) {
        topKHeap.pop();
        topKHeap.push(item);
      }
    }

    // Extract and sort final results.
    const topKItems: { term: string; score: number }[] = [];
    while (topKHeap.size > 0) {
      topKItems.push(topKHeap.pop()!);
    }

    //TODO: Add a regex check to strip off the '.' -> Later tidy this up and add it to the tokenizer so we clean it up from the start
    return topKItems
      .sort((a, b) => b.score - a.score)
      .map((s) => s.term.replace(/\./g, ""))
      .filter((term) => term.length > 0);
  }
  //#endregion

  //#region Get Random
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
  //#endregion
}

export const searchService = new SearchService();

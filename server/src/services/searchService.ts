import { trie } from "../autocomplete/trie.js";
import { invertedIndex } from "../index/invertedIndex.js";

class SearchService {
  async search(query: string) {
    // Skip Redis for now - causes delays on cold starts
    // TODO: Add Redis back with better connection pooling
    
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

    return resultsWithDocs;
  }

  async autocomplete(query: string, limit: number) {
    return trie.getSuggestions(query, limit);
  }
}

export const searchService = new SearchService();

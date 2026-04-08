import { MinHeap } from "../autocomplete/minHeap.js";
import { Jaccard } from "./jaccard.js";

interface DocumentInput {
  id: string;
  content: string;
  title: string;
  url: string;
}

export interface SimiliarDoc {
  id: string;
  title: string;
  url: string;
  similarityScore: number;
}

/**
 * Wrapper method to hide the low level method calls for the jaccard implementation
 * Jaccard ranges from 0 to 1:
 * | Score | Meaning | Use Case |
 * |-------|---------|----------|
 * | 0.0 - 0.1 | Very different | Exclude |
 * | 0.1 - 0.3 | Somewhat related | Looser matching |
 * | 0.3 - 0.5 | Moderately similar | Good for "related articles" |
 * | 0.5 - 0.7 | Very similar | Strong topic match |
 * | 0.7 - 1.0 | Highly similar | Might be duplicates |
 */
class DocumentSimilarity {
  private config = Object.freeze({
    MIN_SIMILARITY: 0.2,
    TOP_K: 10,
  });

  private jaccard = new Jaccard();
  private tokenCache = new Map<string, Set<string>>();

  private buildTokenCache(docs: DocumentInput[]): void {
    this.tokenCache.clear();
    for (const doc of docs) {
      const words = doc.content.toLowerCase().split(/\s+/);
      this.tokenCache.set(doc.id, new Set(words));
    }
  }

  private getTokens(docId: string): Set<string> | undefined {
    return this.tokenCache.get(docId);
  }

  /**
   * Get similarity between two documents
   */
  getSimilarity(docIdA: string, docIdB: string): number {
    const setA = this.getTokens(docIdA);
    const setB = this.getTokens(docIdB);

    if (!setA || !setB) return 0;

    return this.jaccard.jaccardSimilarityFromSets(setA, setB);
  }

  /**
   * Find top-k similiar documents to a given document
   * NOTE: Cache must be built first using buildTokenCache()
   */
  findSimiliar(
    docId: string,
    docs: DocumentInput[],
    topK: number,
  ): SimiliarDoc[] {
    const base = docs.find((d) => d.id === docId);
    if (!base) return [];

    const heap = new MinHeap<SimiliarDoc>(
      (a, b) => b.similarityScore - a.similarityScore,
    );

    for (const doc of docs) {
      if (doc.id === base.id) continue;

      const similarityScore = this.getSimilarity(base.id, doc.id);

      if (similarityScore >= this.config.MIN_SIMILARITY) {
        heap.push({
          id: doc.id,
          title: doc.title,
          url: doc.url,
          similarityScore,
        });
      }

      if (heap.size > topK) {
        heap.pop();
      }
    }

    const results: SimiliarDoc[] = [];
    while (heap.size > 0) {
      results.push(heap.pop()!);
    }

    return results.sort((a, b) => b.similarityScore - a.similarityScore);
  }

  /**
   * Build similarity index for all documents at once
   * Builds token cache once, then computes similarities with progress logging
   */
  buildAllSimilarities(
    docs: DocumentInput[],
    topK: number,
    onProgress?: (current: number, total: number) => void,
  ): Map<string, SimiliarDoc[]> {
    this.buildTokenCache(docs);

    const results = new Map<string, SimiliarDoc[]>();

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const similar = this.findSimiliar(doc.id, docs, topK);
      results.set(doc.id, similar);

      if (onProgress && i % 50 === 0) {
        onProgress(i, docs.length);
      }
    }

    return results;
  }
}

export const documentSimilarity = new DocumentSimilarity();

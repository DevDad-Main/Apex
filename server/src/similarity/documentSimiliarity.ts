import jaccard from "jaccard-similarity-sentences";
import { Document } from "../generated/client.js";

interface SimiliarDoc {
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

  /**
   * Get similarity between two documents
   */
  getSimilarity(docA: Document, docB: Document): number {
    return jaccard.jaccardSimilarity(docA.content, docB.content);
  }

  /**
   * Find top-k similiar documents to a given document
   */
  findSimiliar(docId: string, docs: Document[], topK: number): SimiliarDoc[] {
    const base = docs.find((d) => d.id === docId);
    let similiarDocs: SimiliarDoc[] = [];

    docs.forEach((doc) => {
      // Skip the same document
      if (doc.id === base?.id) return;

      const similarityScore = this.getSimilarity(base, doc);

      if (similarityScore >= this.config.MIN_SIMILARITY) {
        similiarDocs.push({
          id: doc.id,
          title: doc.title,
          url: doc.url,
          similarityScore,
        });
      }
    });

    console.log(`Similiar Docs: `, similiarDocs);

    // Sort by score descending, then slice
    // Performance between the default sort and a min heap. Refactor later if we see a performance hit.
    // | Sort | O(1700 × log 1700) | ~15,000 |
    // | MinHeap | O(1700 × log 10) | ~5,600 |
    return similiarDocs
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, topK);
  }
}

import removeStopWords from "../textProcessor/stopWords.js";
import tokenizer from "../textProcessor/tokenizer.js";
import { termCooccurrenceConfig } from "./config.js";

interface DocumentInput {
  content: string;
  title?: string;
}

class TermCooccurrenceGraph {
  private data: Map<string, Map<string, number>> = new Map();

  private config = termCooccurrenceConfig;

  private addPairs(uniqueTokens: string[]): void {
    //NOTE: Nothing to pair
    if (uniqueTokens.length < 2) return;

    for (let i = 0; i < uniqueTokens.length; i++) {
      const windowEnd = Math.min(
        i + this.config.windowSize,
        uniqueTokens.length,
      );
      for (let j = i + 1; j < windowEnd; j++) {
        const termA = uniqueTokens[i];
        const termB = uniqueTokens[j];

        // Get existing related terms map or create empty one
        let relatedToA = this.data.get(termA);
        if (!relatedToA) {
          relatedToA = new Map();
          this.data.set(termA, relatedToA);
        }
        // Get existing weight or default to 0
        const weight = relatedToA.get(termB) || 0;
        relatedToA.set(termB, weight + 1);
        // Make it bidirectional (termB → termA)
        let relatedToB = this.data.get(termB);
        if (!relatedToB) {
          relatedToB = new Map();
          this.data.set(termB, relatedToB);
        }
        const weightB = relatedToB.get(termA) || 0;
        relatedToB.set(termA, weightB + 1);
      }
    }
  }

  constructor() {}

  // #region Reset Graph
  /**
   * Resets the graph
   */
  reset(): void {
    this.data.clear();
  }
  // #endregion

  // #region Size
  /**
   * Return number of unique terms
   */
  size() {
    return this.data.size;
  }
  // #endregion

  // #region Add Document
  /**
   * Record co-occurences between terms in a document
   *
   */
  addDocument(text: string): void {
    // NOTE: Tokenize and filter stop words
    const tokens = removeStopWords(tokenizer(text));

    // NOTE: Deduplicate
    const uniqueTokens = [...new Set(tokens)];

    this.addPairs(uniqueTokens);
  }
  // #endregion

  // #region Get Related Terms
  getRelatedTerms(term: string, limit?: number): string[] {
    term = term.toLowerCase().trim();

    const related = this.data.get(term);

    if (!related) return [];

    const pairs = Array.from(related.entries());
    // NOTE: Descending by weight, we can use built in sort here as the array is small.
    // NOTE: If it grows then use a differnet algo
    pairs.sort((a, b) => b[1] - a[1]);

    //NOTE: The same as pairs.map((t)=> t[0])
    // NOTE: Just destructure the first element in the array from our pairs as they are [key,value pairs]
    const result = pairs.map(([t]) => t);
    const effectiveLimit = limit ?? this.config.maxRelatedTerms;

    return result.slice(0, effectiveLimit);
  }
  // #endregion

  // #region Expand Query
  /**
   * Returns an expanded query for related terms.
   *
   * query: "fast car"
   * tokens → ["fast", "car"]
   * related:
   * fast → ["quick", "speedy"]
   * car  → ["vehicle", "auto"]
   */
  expandQuery(query: string, topK?: number): string[] {
    if (query.length === 0) return [];

    // NOTE: Tokenize and filter stop words
    const tokens = removeStopWords(tokenizer(query));

    // Skip expansion for short tokens (prevents "java" → "javascript")
    const hasShortToken = tokens.some(
      (t) => t.length <= this.config.minQueryLength,
    );

    if (hasShortToken) {
      return tokens;
    }

    const effectiveTopK = topK ?? this.config.queryExpansionLimit;

    // NOTE: Get related terms (flattened) && Empty array check if nothing is returned
    const relatedTerms = tokens.flatMap((token) => {
      return this.getRelatedTerms(token, effectiveTopK) ?? [];
    });

    // Spread and return the original tokens and our new related terms
    const expandedSet = new Set([...tokens, ...relatedTerms]);

    return Array.from(expandedSet);
  }
  // #endregion

  // #region Build From Documents
  buildFromDocuments(docs: DocumentInput[]): void {
    // NOTE: Reset the graph before re building with new data
    if (docs.length === 0) return;
    this.reset();

    // NOTE: Count Frequencies
    const docFreq = new Map<string, number>();

    for (const doc of docs) {
      const tokens = removeStopWords(tokenizer(doc.content));
      const unique = [...new Set(tokens)];
      for (const token of unique) {
        docFreq.set(token, (docFreq.get(token) || 0) + 1);
      }
    }

    for (const doc of docs) {
      const fullText = doc.title ? `${doc.title} ${doc.content}` : doc.content;
      const tokens = removeStopWords(tokenizer(fullText));

      // Filter to only frequent terms
      const frequentTerms = tokens.filter(
        (token) => (docFreq.get(token) || 0) >= this.config.minTermFrequency,
      );

      const uniqueFrequent = [...new Set(frequentTerms)];

      this.addPairs(uniqueFrequent);
    }
  }
  // #endregion

  // #region Serialize
  serialize() {
    if (this.data.size === 0) return {};

    const obj: Record<string, Record<string, number>> = {};

    for (const [term, related] of this.data.entries()) {
      obj[term] = Object.fromEntries(related);
    }

    return JSON.stringify(obj);
  }
  // #endregion

  // #region Deserialize
  deserialize(json: string) {
    // NOTE: Add null checks
    const obj = JSON.parse(json);

    const graph = new TermCooccurrenceGraph();

    for (const [term, relatedObj] of Object.entries(obj)) {
      graph.data.set(term, new Map(Object.entries(relatedObj!)));
    }

    return graph;
  }

  // #endregion
}

export const termCooccurrenceGraph = new TermCooccurrenceGraph();

// termCooccurrenceGraph.addDocument(
//   "The quick brown fox jumps over the lazy dog",
// );
// termCooccurrenceGraph.addDocument("The fox is quick and clever");
// termCooccurrenceGraph.addDocument("Lazy dogs don't jump over clever foxes");
// termCooccurrenceGraph.addDocument("A brown dog and a clever fox are friends");

// console.log(`Number of unique Terms: `, termCooccurrenceGraph.size());

// console.log("Related to 'fox':", termCooccurrenceGraph.getRelatedTerms("fox"));
// console.log("Related to 'dog':", termCooccurrenceGraph.getRelatedTerms("dog"));
// console.log(
//   "Related to 'clever':",
//   termCooccurrenceGraph.getRelatedTerms("clever"),
// );

// console.log(
//   "Top 2 related to 'fox':",
//   termCooccurrenceGraph.getRelatedTerms("fox", 2),
// );
// Example output: ["clever", "quick"]

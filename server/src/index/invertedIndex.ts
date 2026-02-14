/**
 * @fileoverview Inverted Index implementation for the search engine.
 *
 * The inverted index is the core data structure used by search engines.
 * Unlike a forward index (document -> words), an inverted index maps
 * words to the documents containing them, enabling fast O(1) lookups.
 *
 * Key Concepts:
 * - TF (Term Frequency): How many times a term appears in a document
 * - DF (Document Frequency): In how many documents does a term appear
 *
 * Index Structure:
 * Map<term, { docIds: Set<docId>, tf: Map<docId, count>, df: number }>
 *
 * @module index/invertedIndex
 */

import { log } from "console";
import { loadDocuments, saveDocuments } from "../scraper/persistence";
import { scrapeUrl } from "../scraper/scraper";
import removeStopWords from "../textProcessor/stopWords";
import tokenizer from "../textProcessor/tokenizer";
import { sampleDocs } from "./sampleDocs";

/**
 * Represents a document in the search system.
 *
 * @interface Document
 * @property {string} id - Unique identifier for the document
 * @property {string} content - The main text content to be indexed and searched
 * @property {string} [title] - Optional title for additional context
 */
interface Document {
  id: string;
  content: string;
  title?: string;
}

/**
 * Represents a search result returned from a query.
 *
 * @interface SearchResult
 * @property {string} documentId - The ID of the matching document
 * @property {number} score - Relevance score (higher = more relevant)
 * @property {number} termFrequency - Total term frequency across matched terms
 */
interface SearchResult {
  documentId: string;
  score: number;
  termFrequency: number;
}

/**
 * An entry in the inverted index for a single term.
 *
 * @interface IndexEntry
 * @property {Set<string>} docIds - Set of document IDs containing this term
 * @property {Map<string, number>} tf - Term frequency map: docId -> count
 * @property {number} df - Document frequency: number of unique docs containing the term
 */
interface IndexEntry {
  docIds: Set<string>;
  tf: Map<string, number>;
  df: number;
}

/**
 * InvertedIndex - A search index data structure for fast full-text search.
 *
 * This class implements an inverted index, which maps each unique term
 * to the documents containing it, along with term frequency information.
 *
 * @class InvertedIndex
 *
 * @example
 * const index = new InvertedIndex();
 * index.addDocument({ id: "1", title: "Python Guide", content: "Python is great" });
 * const results = index.search("python"); // Returns matching documents
 */
class InvertedIndex {
  /**
   * The main inverted index data structure.
   *
   * Maps each unique term to an IndexEntry containing:
   * - docIds: Set of document IDs that contain this term
   * - tf: Map of document ID to term frequency (count in that document)
   * - df: Document frequency (how many documents contain this term)
   *
   * @private
   * @type {Map<string, IndexEntry>}
   */
  private index: Map<string, IndexEntry>;

  /**
   * Stores the original documents by their ID.
   * Used for retrieving full document content from search results.
   *
   * @private
   * @type {Map<string, Document>}
   */
  private documents: Map<string, Document>;

  /**
   * Total number of documents currently indexed.
   *
   * @private
   * @type {number}
   */
  private totalDocs: number;

  /**
   * Creates a new empty InvertedIndex.
   *
   * @constructor
   */
  constructor() {
    this.index = new Map();
    this.documents = new Map();
    this.totalDocs = 0;
  }

  /**
   * Retrieves a document by its ID.
   *
   * @param docId - The unique identifier of the document
   * @returns The Document if found, undefined otherwise
   */
  getDocument(docId: string): Document | undefined {
    return this.documents.get(docId);
  }

  /**
   * Adds a document to the inverted index.
   *
   * Processing steps:
   * 1. Combine title and content into a single text string
   * 2. Tokenize the text (split into individual words)
   * 3. Remove stop words (common words with no search value)
   * 4. Count term frequencies within this document
   * 5. Update the inverted index with term-document mappings
   * 6. Store the original document for later retrieval
   *
   * @param {Document} doc - The document to add to the index
   * @returns {void}
   *
   * @example
   * index.addDocument({
   *   id: "1",
   *   title: "Python Guide",
   *   content: "Python is a great programming language"
   * });
   */
  addDocument(doc: Document): void {
    // Step 1: Combine title and content (title provides additional context)
    const fullText = doc.title ? `${doc.title} ${doc.content}` : doc.content;

    // Step 2 & 3: Tokenize and remove stop words
    const tokens = removeStopWords(tokenizer(fullText));

    // Step 4: Count term frequencies within this document
    // This gives us: "hello hello world" -> { "hello": 2, "world": 1 }
    const termCounts = new Map<string, number>();
    for (const token of tokens) {
      termCounts.set(token, (termCounts.get(token) || 0) + 1);
    }

    // Step 5: Update the inverted index
    for (const [term, count] of termCounts) {
      if (!this.index.has(term)) {
        this.index.set(term, {
          docIds: new Set<string>(),
          tf: new Map<string, number>(),
          df: 0,
        });
      }

      const entry = this.index.get(term)!;

      // TF (Term Frequency): How many times this term appears in THIS document
      entry.tf.set(doc.id, count);

      // Track which documents contain this term (for DF calculation)
      entry.docIds.add(doc.id);

      // DF (Document Frequency): Number of unique docs containing this term
      entry.df = entry.docIds.size;
    }

    // Step 6: Store the original document
    this.documents.set(doc.id, doc);

    // Track total document count
    this.totalDocs++;
  }

  /**
   * Searches the index for documents matching the query.
   *
   * Search algorithm:
   * 1. Tokenize the query (same pipeline as documents)
   * 2. For each query term, look up matching documents in the index
   * 3. Accumulate term frequencies (TF) across all matched terms
   * 4. Sort results by score (descending)
   *
   * @param {string} query - The search query string
   * @returns {SearchResult[]} Array of matching documents sorted by relevance
   *
   * @example
   * const results = index.search("python javascript");
   * // Returns: [{ documentId: "2", score: 3, termFrequency: 3 }, ...]
   */
  search(query: string): SearchResult[] {
    // Step 1: Tokenize the query (same pipeline as documents)
    const queryTokens = removeStopWords(tokenizer(query));

    // If no valid tokens after processing, return empty results
    if (queryTokens.length === 0) {
      return [];
    }

    // Step 2 & 3: Look up terms and accumulate scores
    // Map: documentId -> { tf: total term frequency, matches: number of query terms matched }
    const docScores = new Map<string, { tf: number; matches: number }>();

    // For each query term, find matching documents
    for (const term of queryTokens) {
      const entry = this.index.get(term);

      if (!entry) {
        continue; // Term not found in any document
      }

      // For each document containing this term, accumulate the score
      for (const [docId, termFreq] of entry.tf) {
        const existing = docScores.get(docId) || { tf: 0, matches: 0 };

        existing.tf += termFreq; // Sum of term frequencies
        existing.matches += 1; // Count of query terms matched

        docScores.set(docId, existing);
      }
    }

    // Step 4: Convert to array and sort by score (descending)
    const results: SearchResult[] = [];
    for (const [docId, data] of docScores) {
      results.push({
        documentId: docId,
        score: data.tf, // Total term frequency as relevance score
        termFrequency: data.tf,
      });
    }

    // Sort: highest scores first
    results.sort((a, b) => b.score - a.score);

    return results;
  }

  async scrapeAndIndex(url: string): Promise<void> {
    const doc = await scrapeUrl(url);
    this.addDocument({
      id: doc.id,
      title: doc.title,
      content: doc.content,
    });

    const docs = loadDocuments();
    docs.push(doc);
    saveDocuments(docs);
  }

  // // Optional helpers
  // getDocument(docId: string): Document | undefined;
  // getTermFrequency(term: string, docId: string): number;
  // getDocumentFrequency(term: string): number;
}

async function main() {
  const index = new InvertedIndex();

  // Add sample docs
  sampleDocs.forEach((doc) => index.addDocument(doc));

  // Scrape and index a url
  await index.scrapeAndIndex("https://en.wikipedia.org/wiki/Javascript");

  // Search
  const results = index.search("javascript");
  console.log(results);
}

main();

/**
 * @fileoverview Trie (Prefix Tree) implementation for autocomplete functionality.
 *
 * A Trie is a tree data structure used for efficient prefix-based searches.
 * Each node represents a character, and paths from root to leaf form complete words.
 * This enables O(m) time complexity for autocomplete lookups, where m is the
 * length of the prefix.
 *
 * Example structure for words "python", "pyramid", "react":
 *
 *                 (root)
 *                /  |  \
 *               p   r   ...
 *               |
 *               y
 *             / | \
 *            r  t ...
 *           /|
 *          a m
 *         /  \
 *        m    e
 *        |
 *        i
 *        |
 *        d
 *
 * @module autocomplete/trie
 */

import { extractPhases } from "@/textProcessor/tokenizer.js";

/**
 * Represents a single node in the Trie.
 * Each node stores:
 * - children: Map of character -> TrieNode (the next characters)
 * - isEndOfWord: boolean marking if this node completes a valid word
 *
 * @class TrieNode
 */
class TrieNode {
  /**
   * Map of child nodes, keyed by character.
   * Using Map instead of array for dynamic, sparse storage.
   *
   * @type {Map<string, TrieNode>}
   */
  children: Map<string, TrieNode>;

  /**
   * Flag indicating whether this node marks the end of a valid word.
   * When true, the path to this node represents a complete word.
   *
   * @type {boolean}
   */
  isEndOfWord: boolean;

  /**
   * Creates a new TrieNode instance.
   *
   * @constructor
   */
  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
  }
}

/**
 * Trie (Prefix Tree) data structure for efficient autocomplete.
 *
 * Supports:
 * - Inserting words into the trie
 * - Getting autocomplete suggestions for a given prefix
 * - Building the trie from a collection of documents
 *
 * @class Trie
 *
 * @example
 * const trie = new Trie();
 * trie.insert("python");
 * trie.insert("pyramid");
 * const suggestions = trie.getSuggestions("py");
 * // Returns: ["python", "pyramid"]
 */
class Trie {
  /**
   * The root node of the Trie.
   * The root represents an empty prefix - all words start from here.
   *
   * @private
   * @type {TrieNode}
   */
  private root: TrieNode;

  /**
   * Creates a new empty Trie.
   *
   * @constructor
   */
  constructor() {
    this.root = new TrieNode();
  }

  /**
   * Inserts a word into the Trie.
   *
   * Process:
   * 1. Start at root node
   * 2. For each character in the word:
   *    - If child node doesn't exist, create it
   *    - Move to the child node
   * 3. Mark the final node as end of word
   *
   * Time Complexity: O(m) where m is the word length
   * Space Complexity: O(m) in worst case (new path)
   *
   * @param {string} word - The word to insert (case-sensitive)
   * @returns {void}
   *
   * @example
   * trie.insert("python");
   * // Creates path: root -> p -> y -> t -> h -> o -> n
   */
  insert(word: string): void {
    let curr = this.root;

    for (let letter of word) {
      if (!curr.children.has(letter)) {
        curr.children.set(letter, new TrieNode());
      }
      curr = curr.children.get(letter)!;
    }

    curr.isEndOfWord = true;
  }

  /**
   * Retrieves autocomplete suggestions for a given prefix.
   *
   * Algorithm:
   * 1. Navigate to the node representing the last character of the prefix
   * 2. If prefix doesn't exist in Trie, return empty array
   * 3. Perform depth-first search (DFS) from this node
   * 4. Collect all complete words (where isEndOfWord is true)
   * 5. Return up to 'limit' suggestions
   *
   * Time Complexity: O(m + n) where m = prefix length, n = number of suggestions
   *
   * @param {string} prefix - The prefix to search for
   * @param {number} [limit=10] - Maximum number of suggestions to return
   * @returns {string[]} Array of suggested words starting with the prefix
   *
   * @example
   * trie.insert("python");
   * trie.insert("pyramid");
   * trie.insert("react");
   *
   * trie.getSuggestions("py");
   * // Returns: ["python", "pyramid"]
   *
   * trie.getSuggestions("py", 1);
   * // Returns: ["python"] (limited to 1)
   */
  getSuggestions(prefix: string, limit: number = 10): string[] {
    let curr = this.root;

    // Navigate to the prefix node
    for (const letter of prefix) {
      if (!curr.children.has(letter)) {
        return [];
      }
      curr = curr.children.get(letter)!;
    }

    const results: string[] = [];

    /**
     * Recursively collects all complete words from a given node.
     * Uses depth-first search (DFS) to traverse all child branches.
     *
     * @param {TrieNode} node - Current node in the traversal
     * @param {string} currentWord - The word formed so far from root to this node
     */
    function collectWords(node: TrieNode, currentWord: string): void {
      if (results.length >= limit) return;

      if (node.isEndOfWord) {
        results.push(currentWord);
      }

      for (const [char, childNode] of node.children) {
        collectWords(childNode, currentWord + char);
      }
    }

    collectWords(curr, prefix);
    return results;
  }

  /**
   * Builds the Trie from an array of documents.
   *
   * Process:
   * 1. For each document, extract text (title + content)
   * 2. Tokenize the text into individual words
   * 3. Insert each unique word into the Trie
   *
   * Note: This replaces any existing data in the Trie.
   *
   * @param {Array<{id: string; title?: string; content: string}>} documents - Array of documents to index
   * @param {(text: string) => string[]>} tokenizer - Function to tokenize text into words
   * @returns {void}
   *
   * @example
   * const documents = [
   *   { id: "1", title: "Python Guide", content: "Python is a great language" },
   *   { id: "2", title: "JavaScript Basics", content: "JavaScript is versatile" }
   * ];
   *
   * trie.buildFromDocuments(documents, defaultTokenizer);
   * trie.getSuggestions("pyth");
   * // Returns: ["python"]
   */
  buildFromDocuments(
    documents: Array<{ id: string; title?: string; content: string }>,
    tokenizer: (text: string) => string[],
    extractPhrases: (text: string) => string[],
  ): void {
    // Clear existing trie by creating new root
    this.root = new TrieNode();

    const insertedWords = new Set<string>();

    for (const doc of documents) {
      // Combine title and content for indexing
      const fullText = doc.title ? `${doc.title} ${doc.content}` : doc.content;

      // Tokenize and insert each word
      const words = tokenizer(fullText);
      const phrases = extractPhrases(fullText);

      for (const word of words) {
        // Avoid inserting duplicates
        if (!insertedWords.has(word)) {
          this.insert(word);
          insertedWords.add(word);
        }
      }

      // Insert phrases (bigrams)
      for (const phrase of phrases) {
        if (!insertedWords.has(phrase)) {
          this.insert(phrase);
          insertedWords.add(phrase);
        }
      }
    }
  }
}

/**
 * Singleton instance of the Trie for global autocomplete functionality.
 * Import this instance across the application to share the same autocomplete index.
 *
 * @example
 * import { trie } from "./trie";
 *
 * trie.insert("react");
 * const suggestions = trie.getSuggestions("re");
 */
export const trie = new Trie();

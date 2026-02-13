/**
 * @fileoverview Stop words filtering for the search engine.
 * 
 * Stop words are common words that appear frequently in natural language but carry
 * little to no semantic meaning for search purposes. Examples include articles,
 * prepositions, pronouns, and common verbs.
 * 
 * Why filter stop words?
 * - Reduces index size (fewer terms to store)
 * - Improves search quality (avoids matching every document)
 * - Increases performance (smaller dataset to search)
 * 
 * @module textProcessor/stopWords
 */

/**
 * A Set containing common English stop words that should be filtered out
 * during text processing.
 * 
 * Categories included:
 * - Articles: a, an, the
 * - Prepositions: in, on, at, to, from, for
 * - Pronouns: it, he, she, they, you, we
 * - Common verbs: is, are, was, were, be, have, do, will
 * - Conjunctions: and, or, but, if
 * - Other common words: the, that, this, those, these
 * 
 * @example
 * STOP_WORDS.has("the");  // true
 * STOP_WORDS.has("python"); // false
 */
export const STOP_WORDS = new Set([
  "a",
  "about",
  "above",
  "after",
  "again",
  "against",
  "all",
  "am",
  "an",
  "and",
  "any",
  "are",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "below",
  "between",
  "both",
  "but",
  "by",
  "can",
  "did",
  "do",
  "does",
  "doing",
  "don",
  "down",
  "during",
  "each",
  "few",
  "for",
  "from",
  "further",
  "had",
  "has",
  "have",
  "having",
  "he",
  "her",
  "here",
  "hers",
  "herself",
  "him",
  "himself",
  "his",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "itself",
  "just",
  "me",
  "more",
  "most",
  "my",
  "myself",
  "no",
  "nor",
  "not",
  "now",
  "of",
  "off",
  "on",
  "once",
  "only",
  "or",
  "other",
  "our",
  "ours",
  "ourselves",
  "out",
  "over",
  "own",
  "same",
  "she",
  "should",
  "so",
  "some",
  "such",
  "than",
  "that",
  "the",
  "their",
  "theirs",
  "them",
  "themselves",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "until",
  "up",
  "very",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "whom",
  "why",
  "will",
  "with",
  "would",
  "you",
  "your",
  "yours",
  "yourself",
  "yourselves",
]);
//#endregion

export default function removeStopWords(tokens: string[]): string[] {
  return tokens.filter((token) => !STOP_WORDS.has(token));
}

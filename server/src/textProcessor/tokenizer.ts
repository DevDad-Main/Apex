/**
 * @fileoverview Text tokenizer for the search engine.
 *
 * Tokenization is the process of breaking raw text into individual words (tokens).
 * This is the first step in the text processing pipeline before indexing.
 *
 * @module textProcessor/tokenizer
 */

/**
 * Tokenizes input text by converting to lowercase and extracting only alphabetic words.
 *
 * Processing steps:
 * 1. Replace apostrophes (contractions) - "don't" becomes "dont"
 * 2. Convert to lowercase for case-insensitive matching
 * 3. Extract only alphabetic sequences using regex
 *
 * @param input - The raw text string to tokenize
 * @returns An array of lowercase word tokens
 *
 * @example
 * tokenizer("Hello World! How's it going?");
 * // Returns: ["hello", "world", "hows", "it", "going"]
 */
export default function tokenizer(input: string): string[] {
  // Remove apostrophies
  const output = input.replace(/'/g, "");
  // return output.toLowerCase().match(/[a-zA-Z]+/g) || [];
  const matches = output.toLowerCase().match(/[a-zA-Z0-9+#.]+/g) || [];
  // Filter out single characters
  return matches.filter((word) => word.length > 1);
}

export function extractPhrases(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const phrases: string[] = [];

  for (let i = 0; i < words.length - 1; i++) {
    const cleanWord1 = words[i].replace(/[^a-zA-Z0-9+#.]/g, "");
    const cleanWord2 = words[i + 1].replace(/[^a-zA-Z0-9+#.]/g, "");
    if (cleanWord1.length > 2 && cleanWord2.length > 2) {
      phrases.push(`${cleanWord1} ${cleanWord2}`);
    }
  }

  return phrases;
}

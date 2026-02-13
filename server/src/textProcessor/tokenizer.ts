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
  const output = input.replace(/'/g, "");
  return output.toLowerCase().match(/[a-zA-Z]+/g) || [];
}

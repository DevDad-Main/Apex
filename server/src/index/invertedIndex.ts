import removeStopWords from "../textProcessor/stopWords.js";
import tokenizer from "../textProcessor/tokenizer.js";

interface Document {
  id: string;
  content: string;
  title?: string;
}

interface SearchResult {
  documentId: string;
  score: number;
  termFrequency: number;
}

class InvertedIndex {
  // Main index: term -> { docIds: Set<string>, tf: Map<docId, count>, df: number }

  private index: Map<
    string,
    { docIds: Set<string>; tf: Map<string, number>; df: number }
  >;

  // Store original documents;
  private documents: Map<string, Document>;

  // Total number of documents in index
  private totalDocs: number;

  constructor() {
    this.index = new Map();
    this.documents = new Map();
    this.totalDocs = 0;
  }

  addDocument(doc: Document): void {
    // 1. Tokenize and process
    const fullText = doc.title ? `${doc.title} ${doc.content}` : doc.content;
    const tokenizedString = tokenizer(fullText);
    const tokens = removeStopWords(tokenizedString);

    // 2. For each unique term in doc:
    //    - Update term frequency (tf)
    //    - Add docId to the term's document set
    //    - Update document frequency (df)

    // For each token in the document
    for (const token of tokens) {
      // If term not in index, create entry
      // Update term frequency for this doc (count occurrences)
      // Add doc ID to the set of documents containing this term
      // Update document frequency
    }

    // 3. Store the document
    // 4. Increment totalDocs
  }
  search(query: string): SearchResult[] {
    // 1. Tokenize query
    // 2. For each term, look up in index
    // 3. Aggregate results
    // 4. Rank by term frequency (or TF-IDF later)
  }
  // Optional helpers
  getDocument(docId: string): Document | undefined;
  getTermFrequency(term: string, docId: string): number;
  getDocumentFrequency(term: string): number;
}

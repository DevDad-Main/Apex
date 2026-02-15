class TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
  }
}

class Trie {
  private root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  insert(word: string): void {
    // Initialize the curr pointer with the root node
    let curr = this.root;

    // Iterate across the length of the string
    for (let letter of word) {
      if (!curr.children.has(letter)) {
        curr.children.set(letter, new TrieNode());
      }
      curr = curr.children.get(letter)!;
    }

    // Mark the end of the word
    curr.isEndOfWord = true;
  }

  getSuggestions(prefix: string, limit: number = 10): string[] {
    // Navigte to the node for the last letter of prefix
    let curr = this.root;
    for (const letter of prefix) {
      if (!curr.children.has(letter)) {
        return []; // No words start with this prefix;
      }
      curr = curr.children.get(letter)!;
    }

    // Collect all words form this node using recusrion
    const results: string[] = [];

    function collectWords(node: TrieNode, currentWord: string) {
      // Stop if we have enough or exceed the limit
      if (results.length >= limit) return;

      if (node.isEndOfWord) {
        // Found a complete word!
        results.push(currentWord);
      }

      // Recurse through all children
      for (const [char, childNode] of node.children) {
        collectWords(childNode, currentWord + char);
      }
    }

    collectWords(curr, prefix);
    return results;
  }
}

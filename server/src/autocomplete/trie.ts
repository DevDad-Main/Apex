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

  getSuggestions(prefix: string, limit?: number): string[] {}
}

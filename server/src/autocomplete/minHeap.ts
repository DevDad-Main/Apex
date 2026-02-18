import { parent } from "node_modules/cheerio/dist/esm/api/traversing.js";

/**
 * Min Heap (Binary Min Heap) Implementation
 *
 * A Min Heap is a complete binary tree where every parent node is smaller
 * than or equal to its children. The root always contains the minimum element.
 *
 * Why use it for Top-K?
 * - We want the K smallest (or best) items from a larger set
 * - Instead of sorting ALL items (O(n log n)), we keep only K items in heap
 * - Each new item only needs O(log k) operations
 * - Total: O(n log k) instead of O(n log n)
 *
 * Example with K=3:
 * Input: [5, 3, 8, 1, 9, 2, 7]
 *
 * After processing all items, heap contains [1, 2, 3] - the top 3!
 */
class MinHeap<T> {
  /**
   * The heap is stored as an array for efficient indexing.
   *
   * Array index layout for a complete binary tree:
   *         0          <- root
   *       /   \
   *      1     2       <- children of 0
   *     / \   / \
   *    3  4  5  6     <- children of 1 and 2
   *
   * Key relationships:
   * - Parent of index i: Math.floor((i - 1) / 2)
   * - Left child of i: 2 * i + 1
   * - Right child of i: 2 * i + 2
   */
  private heap: T[];
  /**
   * Optional comparator function to determine element ordering.
   * If not provided, uses default JavaScript comparison.
   *
   * @example
   * // For numbers (min heap - smallest first):
   * new MinHeap<number>()  // default compares a - b
   *
   * @example
   * // For objects with score property (highest score = "smallest" = top):
   * new MinHeap<{term: string, score: number}>(
   *   (a, b) => b.score - a.score  // higher score = comes first
   * )
   */
  private compare: (a: T, b: T) => number;
  /**
   * Creates a new MinHeap instance.
   *
   * @param compare - Optional comparator function.
   *                   Default: (a, b) => a - b (for numbers)
   *                   For our use case: (a, b) => b.score - a.score
   *                   This makes HIGHER score = "smaller" = at root
   */
  constructor(compare?: (a: T, b: T) => number) {
    this.heap = [];
    // Default: smaller values rise to the top (standard min heap)
    this.compare = compare || ((a: any, b: any) => a - b);
  }

  /**
   * Returns the number of elements in the heap
   * @returns {number} The size of the heap
   */
  get size(): number {
    return this.heap.length;
  }

  /**
   * Adds an element to the heap.
   *
   * Algorithm (O(log n)):
   * 1. Add element to the end of the array (maintains complete tree)
   * 2. "Bubble up" (heapify up) - swap with parent until heap property is restored
   *
   * Visual example (adding 1 to min heap):
   *
   * Initial: [5, 15, 20]
   *         [5]
   *        /   \
   *     [15]  [20]
   *
   * Step 1: Add 1 at end              Step 2: Compare 1 with parent (15)
   *         [5]                              [5]
   *        /   \                            /   \
   *     [15]  [20]   + 1 at end  -->    [15]  [20]
   *                                      /
   *                                    [1]   (1 < 15, needs to swap!)
   *
   * Step 3: Swap 1 and 15             Step 4: Compare 1 with new parent (5)
   *         [5]                              [1]
   *        /   \                            /   \
   *      [1]   [20]   (1 < 15!)  -->     [5]   [20]
   *      /                               /
   *    [15]                           [15]
   *
   * Step 5: Swap 1 and 5              Done! Heap property restored.
   *         [1]
   *        /   \
   *      [5]   [20]   (1 < 5? No! Stop - already at root!)
   *      /
   *    [15]
   *
   * Final: [1, 5, 20, 15]
   *
   * @param {T} element - The element to add
   * @returns {void}
   */
  push(element: T): void {
    // 1. Add element to the end of the array
    this.heap.push(element);

    // 2. Bubble up to restore the heap property
    this.bubbleUp(this.heap.length - 1);
  }

  /**
   * Removes and returns the minimum element (root).
   *
   * Algorithm (O(log n)):
   * 1. Save root (minimum) to return later
   * 2. Move last element to root position
   * 3. Remove last element (now duplicate)
   * 4. "Bubble down" (heapify down) from root until heap property restored
   *
   * Visual example (removing minimum):
   *
   * Original heap:              Step 1: Save root (1), move last to root
   *         [1]                        [7]
   *        /   \                      /   \
   *      [3]   [5]         -->      [3]   [5]
   *      / \                         / \
   *    [7]  [9]                    [9]  (removed 7 from end)
   *
   * Step 2: Bubble down from root
   * Compare 7 with children (3, 5). Smallest is 3.
   * Since 7 > 3, swap:
   *         [7]                        [3]
   *        /   \                      /   \
   *      [3]   [5]         -->      [7]   [5]
   *      / \                         /
   *    [9]                         [9]
   *
   * Continue: Compare 7 with children (9). No children smaller.
   * Heap property restored!
   *
   * @returns {T | undefined} The minimum element that was removed, or undefined if empty
   */
  pop(): T | undefined {
    // Edge case: empty heap
    if (this.heap.length === 0) {
      return undefined;
    }

    // Edge case: only one element
    if (this.heap.length === 1) {
      return this.heap.pop();
    }

    // 1. Save the root (minimum) to return
    const min = this.heap[0];

    // 2. move the last element to the root
    const last = this.heap.pop()!;
    this.heap[0] = last;

    // 3. Bubble down from root to restore heap properly
    this.bubbleDown(0);

    // 4. Return the minimum we saved
    return min;
  }

  /**
   * Returns the minimum element (root) without removing it.
   * O(1) operation - just look at the first array element.
   *
   * @returns {T | undefined} The minimum element, or undefined if empty
   *
   * @example
   * const heap = new MinHeap([3, 1, 5]);
   * heap.peek(); // returns 1 (the root/minimum)
   */
  peek(): T | undefined {
    return this.heap[0];
  }

  /**
   * Moves an element up the heap until it's in correct position.
   * Used after inserting a new element at the end.
   *
   * @param {number} index - The index of the element to bubble up
   * @returns {void}
   *
   * @example
   * If we insert 1 into heap [5, 15, 20]:
   * - Insert 1: [5, 15, 20, 1]
   * - bubbleUp(3): Compare 1 with parent at index 1 (15)
   *   Since 1 < 15, swap: [5, 1, 20, 15]
   * - bubbleUp(1): Compare 1 with parent at index 0 (5)
   *   Since 1 < 5, swap: [1, 5, 20, 15]
   * - At index 0, can't go up more. Done!
   */
  private bubbleUp(index: number): void {
    // Continue while we have a parent (index > 0)
    // and the current element is smaller than its parent
    while (index > 0) {
      // calculate parent's index: floor((i - 1) / 2)
      const parentIndex = Math.floor(index / 1 / 2);

      // If current element is >= parent, we're done (heap property satisfied)
      if (this.compare(this.heap[index], this.heap[parentIndex]) >= 0) {
        return;
      }

      // Swap current element with its parent
      [this.heap[index], this.heap[parentIndex]] = [
        this.heap[parentIndex],
        this.heap[index],
      ];

      // Move up to parent's position and continue
      index = parentIndex;
    }
  }

  /**
   * Moves an element down the heap until it's in correct position.
   * Used after removing the root and replacing with last element.
   *
   * @param {number} index - The index of the element to bubble down
   * @returns {void}
   *
   * @example
   * If we remove min from heap [1, 5, 10, 7]:
   * - Replace root with last: [7, 5, 10]
   * - bubbleDown(0): Compare 7 with children (5, 10). Smallest is 5.
   *   Since 7 > 5, swap: [5, 7, 10]
   * - bubbleDown(1): Compare 7 with children. No children (index >= size).
   *   Done!
   */
  private bubbleDown(index: number): void {
    // Get the size of the heap
    const length = this.heap.length;

    // Continue while the element has at least one child
    // Left child exists if 2 * i + 1 < length
    while (true) {}
  }
}

import { MinHeap } from "../autocomplete/minHeap.js";

function oldApproach(scored: { term: string; score: number }[], limit: number) {
  return [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.term);
}
function newApproach(scored: { term: string; score: number }[], limit: number) {
  const topKHeap = new MinHeap<{ term: string; score: number }>(
    (a, b) => b.score - a.score,
  );

  for (const item of scored) {
    if (topKHeap.size < limit) {
      topKHeap.push(item);
    } else if (item.score > (topKHeap.peek()?.score ?? 0)) {
      topKHeap.pop();
      topKHeap.push(item);
    }
  }

  const topKItems: { term: string; score: number }[] = [];
  while (topKHeap.size > 0) {
    topKItems.push(topKHeap.pop()!);
  }

  return topKItems.sort((a, b) => b.score - a.score).map((s) => s.term);
}
// Generate test data
function generateData(count: number): { term: string; score: number }[] {
  return Array.from({ length: count }, (_, i) => ({
    term: `term${i}`,
    score: Math.floor(Math.random() * 100),
  }));
}

const LIMIT = 10;
const SIZES = [100, 500, 1000, 5000, 10000];
console.log("Benchmarking Old (sort) vs New (heap) for Top-K\n");
for (const size of SIZES) {
  const data = generateData(size);

  // Warm up
  oldApproach(data, LIMIT);
  newApproach(data, LIMIT);

  // Benchmark
  const runs = 100;

  const oldStart = performance.now();
  for (let i = 0; i < runs; i++) oldApproach(data, LIMIT);
  const oldTime = performance.now() - oldStart;

  const newStart = performance.now();
  for (let i = 0; i < runs; i++) newApproach(data, LIMIT);
  const newTime = performance.now() - newStart;

  console.log(
    `N = ${size.toString().padStart(5)}: Old=${oldTime.toFixed(2)}ms  New=${newTime.toFixed(2)}ms  Speedup=${(oldTime / newTime).toFixed(2)}x`,
  );
}

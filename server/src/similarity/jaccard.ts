export class Jaccard {
  jaccardSimilarityFromSets(setA: Set<string>, setB: Set<string>): number {
    const intersection = new Set([...setA].filter((w) => setB.has(w)));
    const union = new Set([...setA, ...setB]);

    return intersection.size / union.size;
  }

  jaccardSimilarity(text1: string, text2: string): number {
    return this.jaccardSimilarityFromSets(
      new Set(text1.toLowerCase().split(/\s+/)),
      new Set(text2.toLowerCase().split(/\s+/)),
    );
  }
}

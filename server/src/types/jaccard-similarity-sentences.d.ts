declare module "jaccard-similarity-sentences" {
  const jaccard: {
    jaccardSimilarity(sentence1: string, sentence2: string): number;
  };

  export default jaccard;
}

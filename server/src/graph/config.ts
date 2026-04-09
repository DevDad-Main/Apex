/**
 * windowSize - Terms within 5 words of each other are "relatable"
 * minTermFrequency - Term must appear in at least n(default: 2) documents
 * maxRelatedTerms - Max related terms to return per query
 * queryExpansionLimit - How many related terms to add when expanding
 * minQueryLength - Minimum query length to enable expansion (prevents short queries like "java" → "javascript")
 */
export const termCooccurrenceConfig = {
  windowSize: 5,
  minTermFrequency: 2,
  maxRelatedTerms: 10,
  queryExpansionLimit: 3,
  minQueryLength: 4,
};

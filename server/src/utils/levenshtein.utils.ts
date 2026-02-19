import { logger } from "devdad-express-utils";
import { invertedIndex } from "../index/invertedIndex.js";

function levenshteinDistance(str1: string, str2: string): number {
  if (!str1) {
    console.log("String 1 is empty, undefined, or null");
    return 0;
  }
  if (!str2) {
    console.log("String 2 is empty, undefined, or null");
    return 0;
  }
  const m = str1.length;
  const n = str2.length;

  // 2D array
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Base Cases
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Fill the table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] =
          1 +
          Math.min(
            dp[i - 1][j], // delete
            dp[i][j - 1], // insert
            dp[i - 1][j - 1], // substitute
          );
      }
    }
  }

  return dp[m][n];
}

export function findClosestTerm(query: string): string | null {
  // Get All Unique terms from the Inverted Index
  const terms = Array.from(invertedIndex.getSortedTerms());
  const validCandidates = terms.filter((t) => t[0] === query[0]);

  let closestTerm = null;
  let minDistance = Infinity;
  // Track max document frecency, so if we have multiple options from levensthein distance, we then choose the one with the most document frecency
  let maxDf = 0;

  // Loop through all the valid terms
  for (const term of validCandidates) {
    // Calculate the distance between terms
    const distance = levenshteinDistance(query, term);
    const entry = invertedIndex.getIndexEntry(term);

    const documentFrec = entry?.df || 0;

    // Update - tiebreaker on document frecency instead of just distance based
    if (
      distance < minDistance ||
      (distance === minDistance && documentFrec > maxDf)
    ) {
      minDistance = distance;
      closestTerm = term;
      maxDf = documentFrec;
      logger.info(`Closest Term: ${closestTerm}`);
    }
  }
  // Only return if reasonable.. (e.g distance <= 3)
  // Otherwise might be a wrong suggestion
  if (minDistance <= 3 && closestTerm) {
    return closestTerm;
  }

  return null;
}

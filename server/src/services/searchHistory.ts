import { getRedisClient } from "../utils/redis.utils.js";
import { logger } from "devdad-express-utils";

class SearchHistoryService {
  private readonly REDIS_KEY = "searches:history";
  private readonly MAX_STORED = 10000;

  //#region Record Values
  async record(query: string): Promise<void> {
    const normalized = query.toLowerCase().trim();
    if (!normalized || normalized.length < 2) return;
    try {
      const client = getRedisClient();

      // Sorted set for tracking the historuy of the normalized query and increment score
      await client.zIncrBy(this.REDIS_KEY, 1, normalized);

      // Trim old entries periodically.
      await client.zRemRangeByRank(this.REDIS_KEY, 0, -this.MAX_STORED - 1);
    } catch (error) {
      logger.error(`Failed to connect to redis`, { error });
    }
  }
  //#endregion

  //#region Get Popular
  async getPopular(
    prefix: string,
    limit = 10,
  ): Promise<{ term: string; count: number }[]> {
    const client = getRedisClient();

    // Get top searches ( could optimize with prefix-specicif keys later)
    const results = await client.zRangeWithScores(this.REDIS_KEY, 0, 1000, {
      REV: true,
    });

    const normalizedPrefix = prefix.toLowerCase();
    return results
      .filter((result) => result.value.startsWith(normalizedPrefix))
      .slice(0, limit)
      .map((result) => ({ term: result.value, count: result.score }));
  }
  //#endregion
}

// Singleton
export const searchHistoryService = new SearchHistoryService();

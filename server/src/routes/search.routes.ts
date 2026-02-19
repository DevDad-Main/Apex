import { findClosestTerm } from "../utils/levenshtein.utils.js";
import { searchService } from "../services/searchService.js";
import {
  catchAsync,
  logger,
  sendError,
  sendSuccess,
} from "devdad-express-utils";
import { Router } from "express";
import { searchHistoryService } from "../services/searchHistory.js";

const searchRouter = Router();

searchRouter.get(
  "/",
  catchAsync(async (req, res, next) => {
    const { query, page, limit } = req.query;
    const startTime = performance.now();

    res.set("Cache-Control", "no-store, no-cache, must-revalidate");

    logger.info("Search handler called with query: ... ", {
      Query: req.query,
      IP: req.ip,
    });

    if (!query) {
      return sendError(res, "Invalid query.", 400);
    }

    const pageNum = page ? parseInt(page as string, 10) : 1;
    const limitNum = limit ? parseInt(limit as string, 10) : 10;

    const response = await searchService.search(
      query as string,
      pageNum,
      limitNum,
    );

    const responseTime = Number((performance.now() - startTime).toFixed(2));

    logger.info(`Results found.. ${response.pagination.total}`, {
      results: response.results,
    });

    if (response.results.length === 0) {
      const correction = findClosestTerm(query as string);
      return sendSuccess(
        res,
        { response: { ...response, meta: { responseTimeMs: responseTime } }, correction },
        `No results found for this query. Did you mean: ${correction}?`,
        200,
      );
    }

    // Only record once we have some successful searches
    await searchHistoryService.record(query as string);

    return sendSuccess(
      res,
      { ...response, meta: { responseTimeMs: responseTime } },
      "Successfully found searches for query",
      200,
    );
  }),
);

searchRouter.get(
  "/random",
  catchAsync(async (req, res, next) => {
    const { limit } = req.query;
    const limitNum = limit ? parseInt(limit as string, 10) : 10;

    res.set("Cache-Control", "no-store, no-cache, must-revalidate");

    const results = await searchService.getRandom(limitNum);

    return sendSuccess(
      res,
      {
        results,
        pagination: {
          total: results.length,
          page: 1,
          limit: limitNum,
          totalPages: 1,
        },
      },
      "Random results",
      200,
    );
  }),
);

export default searchRouter;

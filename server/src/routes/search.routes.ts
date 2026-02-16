import { searchService } from "../services/searchService.js";
import {
  catchAsync,
  logger,
  sendError,
  sendSuccess,
} from "devdad-express-utils";
import { Router } from "express";

const searchRouter = Router();

searchRouter.get(
  "/",
  catchAsync(async (req, res, next) => {
    const { query, page, limit } = req.query;
    
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");

    logger.info("Search handler called with query: ... ", {
      Query: req.query,
      IP: req.ip,
    });

    if (!query || query.length === 0) {
      return sendError(res, "Invalid query.", 400);
    }

    const pageNum = page ? parseInt(page as string, 10) : 1;
    const limitNum = limit ? parseInt(limit as string, 10) : 10;

    const response = await searchService.search(query as string, pageNum, limitNum);

    logger.info(`Results found.. ${response.pagination.total}`, { results: response.results });

    if (response.results.length === 0) {
      return sendSuccess(res, response, "No results found for this query.", 200);
    }
    return sendSuccess(
      res,
      response,
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
      { results, pagination: { total: results.length, page: 1, limit: limitNum, totalPages: 1 } },
      "Random results",
      200,
    );
  }),
);

export default searchRouter;

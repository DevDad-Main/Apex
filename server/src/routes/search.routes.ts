import { invertedIndex } from "@/index/invertedIndex.js";
import {
  catchAsync,
  logger,
  sendError,
  sendSuccess,
} from "devdad-express-utils";
import { Router } from "express";

const searchRouter = Router();

searchRouter.post(
  "/",
  catchAsync(async (req, res, next) => {
    const { query } = req.query;
    logger.info("Search handler called with query: ... ", {
      Query: req.query,
      IP: req.ip,
    });

    if (!query || query.length === 0) {
      return sendError(res, "Invalid query.", 400);
    }

    const results = invertedIndex.search(query as string);

    if (results.length === 0) {
      return sendSuccess(res, {}, "No results found for this query.", 200);
    }
    return sendSuccess(
      res,
      results,
      "Successfully found searches for query",
      200,
    );
  }),
);

export default searchRouter;

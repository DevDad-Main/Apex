import { invertedIndex } from "../index/invertedIndex.js";
import {
  catchAsync,
  logger,
  sendError,
  sendSuccess,
} from "devdad-express-utils";
import { Router } from "express";

const scrapeRouter = Router();

scrapeRouter.post(
  "/",
  catchAsync(async (req, res, next) => {
    const { url } = req.body;

    if (!url || url.length === 0) {
      return sendError(res, "Invalid URL", 400);
    }
    try {
      await invertedIndex.scrapeAndIndex(url);

      // Rebuild sorted terms after adding new document
      invertedIndex.rebuildSortedTerms();
    } catch (error: any) {
      logger.error("Failed to parse URL.", { error });
      return sendError(res, error.message || "Failed to parse url", 200);
    }

    return sendSuccess(
      res,
      { IndexedURL: url },
      "Successfully parsed, tokenized and indexed URL",
      200,
    );
  }),
);

export default scrapeRouter;

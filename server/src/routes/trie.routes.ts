import { searchService } from "../services/searchService.js";
import { trie } from "../autocomplete/trie.js";
import { catchAsync, sendError, sendSuccess } from "devdad-express-utils";
import { Router } from "express";

const router = Router();

router.get(
  "/",
  catchAsync(async (req, res, next) => {
    const { q } = req.query;

    /*
			304 was likely caused by Vercel's default caching. I added "no-store, 
			no-cache, must-revalidate" headers to prevent caching for autocomplete.
		*/
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");

    if (!q || typeof q !== "string" || q.length === 0) {
      return sendError(res, "Query parameter 'q' is required.", 400);
    }

    // const suggestions = trie.getSuggestions(q.toLowerCase(), 10);
    const suggestions = await searchService.autocomplete(q.toLowerCase(), 10);

    return sendSuccess(
      res,
      suggestions,
      "Autocomplete suggestions retrieved successfully",
      200,
    );
  }),
);

export default router;

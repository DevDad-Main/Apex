import { catchAsync, sendSuccess } from "devdad-express-utils";
import { Router } from "express";
import { similarityService } from "../services/similarityService.js";

const router = Router();

router.get(
  "/:docId",
  catchAsync(async (req, res, next) => {
    const { docId } = req.params;
    const docIdStr = Array.isArray(docId) ? docId[0] : docId;

    const similiar = await similarityService.getSimiliarDocuments(docIdStr);

    if (similiar.length === 0)
      return sendSuccess(res, {}, "No data found for this document", 404);

    return sendSuccess(
      res,
      similiar,
      " Successfully fetched similiar rests.",
      200,
    );
  }),
);

export default router;

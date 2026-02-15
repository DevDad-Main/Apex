import { Router } from "express";
import { invertedIndex } from "../index/invertedIndex.js";
import { catchAsync, sendError, sendSuccess } from "devdad-express-utils";

const documentsRouter = Router();

documentsRouter.get(
  "/:id",
  catchAsync(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
      return sendError(res, "Invalid ID provided.", 400);
    }

    const doc = invertedIndex.getDocument(id as string);

    if (!doc) {
      return sendError(res, "Document not found.", 404);
    }

    return sendSuccess(res, doc, "Document retrieved successfully.", 200);
  }),
);

documentsRouter.get(
  "/",
  catchAsync(async (req, res, next) => {
    const documents = Array.from(invertedIndex.getAllDocuments());

    return sendSuccess(
      res,
      documents,
      "Documents retrieved successfully.",
      200,
    );
  }),
);

export default documentsRouter;

import { errorHandler, sendSuccess } from "devdad-express-utils";
import express from "express";
import cors from "cors";
import searchRouter from "./routes/search.routes.js";
import scrapeRouter from "./routes/scrape.routes.js";
import documentsRouter from "./routes/documents.routes.js";
import autocompleteRouter from "./routes/trie.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/apex/search", searchRouter);
app.use("/apex/scrape", scrapeRouter);
app.use("/apex/document", documentsRouter);
app.use("/apex/autocomplete", autocompleteRouter);

app.use("/", (req, res, next) => {
  return sendSuccess(res, {}, "Server is up and running!");
});

app.use(errorHandler);

export default app;

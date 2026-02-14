import { errorHandler } from "devdad-express-utils";
import express from "express";
import searchRouter from "./routes/search.routes.js";
import scrapeRouter from "./routes/scrape.routes.js";
import documentsRouter from "./routes/documents.routes.js";

const app = express();

app.use(express.json());

app.use("/apex/search", searchRouter);
app.use("/apex/scrape", scrapeRouter);
app.use("/apex/document", documentsRouter);

app.use(errorHandler);

export default app;

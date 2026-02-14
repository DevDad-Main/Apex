import { errorHandler } from "devdad-express-utils";
import express from "express";
import searchRouter from "./routes/search.routes.js";
import scrapeRouter from "./routes/scrape.routes.js";

const app = express();

app.use(express.json());

app.use("/apex/search", searchRouter);
app.use("/apex/scrape", scrapeRouter);
app.use("/apex/document");

app.use(errorHandler);

export default app;

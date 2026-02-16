import { errorHandler, logger, sendSuccess } from "devdad-express-utils";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import searchRouter from "./routes/search.routes.js";
import scrapeRouter from "./routes/scrape.routes.js";
import documentsRouter from "./routes/documents.routes.js";
import autocompleteRouter from "./routes/trie.routes.js";
import compression from "compression";
import hpp from "hpp";
import helmet from "helmet";

const app = express();

const allowedOrigins =
  process.env.ALLOWED_ORIGINS?.split(",") || "http://localhost:5173";

// Custom mongo-sanitize middleware for Express 5 compatibility
const mongoSanitize = () => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const sanitize = (obj: unknown): unknown => {
      if (typeof obj !== "object" || obj === null) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }

      const sanitized: Record<string, unknown> = {};
      for (const key in obj) {
        // Skip prototype properties
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

        // Blacklist dangerous characters that could lead to NoSQL injection
        if (key.includes("$") || key.includes(".")) {
          logger.warn(`Potentially dangerous field detected: ${key}`);
          continue;
        }

        sanitized[key] = sanitize((obj as Record<string, unknown>)[key]);
      }

      return sanitized;
    };

    // Sanitize request body
    if (req.body) {
      req.body = sanitize(req.body);
    }

    next();
  };
};

// Custom XSS protection middleware for Express 5 compatibility
const xss = () => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const cleanXSS = (obj: unknown): unknown => {
      if (typeof obj === "string") {
        // Basic XSS protection - escape HTML entities
        return obj
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#x27;")
          .replace(/\//g, "&#x2F;");
      }

      if (typeof obj !== "object" || obj === null) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(cleanXSS);
      }

      const cleaned: Record<string, unknown> = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          cleaned[key] = cleanXSS((obj as Record<string, unknown>)[key]);
        }
      }

      return cleaned;
    };

    // Clean request body
    if (req.body) {
      req.body = cleanXSS(req.body);
    }

    next();
  };
};

//#region Middleware
// Compress response data for better performance
app.use(compression());
// Security headers to protect against common vulnerabilities
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], // Only allow resources from same origin
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for CSS frameworks
        scriptSrc: ["'self'"], // Only allow scripts from same origin
        imgSrc: ["'self'", "data:", "https:"], // Allow images from same origin, data URIs, and HTTPS
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for compatibility with some third-party resources
  }),
);
app.use(
  cors({
    origin: allowedOrigins, // Array of allowed domains
    credentials: true, // Allow cookies/auth headers
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // HTTP methods allowed
    allowedHeaders: [
      "Content-Type", // Required for POST/PUT/PATCH to tell server the payload type (JSON, form, etc.)
      "Authorization", // For sending Bearer tokens or other auth headers
      "X-Requested-With", // Often sent by AJAX/fetch to indicate it's an XMLHttpRequest
      "device-remember-token", // Custom header you might use for remembering device/session
      "Accept", // Tells server what response content types the client accepts
    ],
  }),
);

// Parse JSON request bodies with 3MB limit
app.use(express.json({ limit: "3mb" }));
// Parse URL-encoded request bodies with 3MB limit
app.use(express.urlencoded({ extended: true, limit: "3mb" }));

// Prevent NoSQL injection attacks by sanitizing user input (after body parsing)
app.use(mongoSanitize());
// Prevent Cross-Site Scripting (XSS) attacks by cleaning user input
app.use(xss());
// Prevent HTTP Parameter Pollution attacks
app.use(
  hpp({
    whitelist: ["sort", "fields", "page", "limit"], // Allow these parameters for pagination and sorting
  }),
);
//#endregion

app.use("/apex/search", searchRouter);
app.use("/apex/scrape", scrapeRouter);
app.use("/apex/document", documentsRouter);
app.use("/apex/autocomplete", autocompleteRouter);

app.use("/", (req: Request, res: Response) => {
  return sendSuccess(res, {}, "Server is up and running!");
});

app.use(errorHandler);

export default app;

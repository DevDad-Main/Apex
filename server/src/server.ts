import { logger } from "devdad-express-utils";
import app from "./app.js";

const PORT = process.env.PORT || 8000;

(async () => {
  try {
    app.listen(PORT, () => {
      logger.info(`Apex backend is running on port ${PORT}`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received, shutting down gracefully");
      process.exit(0);
    });
  } catch (error) {
    logger.error("Failed to connect to server..", { error });
    process.exit(1);
  }
})();

/* 
The 'unhandledRejection' event is emitted whenever a Promise is rejected and no error handler is attached to the promise within a turn of the event loop. When programming with Promises, exceptions are encapsulated as "rejected promises". Rejections can be caught and handled using promise.catch() and are propagated through a Promise chain. The 'unhandledRejection' event is useful for detecting and keeping track of promises that were rejected whose rejections have not yet been handled.
*/
process.on("unhandledRejection", (reason, p) => {
  logger.error("Unhandled Rejection at: Promise", { reason, p });
  process.exit(1);
});

import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { phiLogger } from "./middleware/phi-logger";
import { sentryRequestHandler, sentryErrorHandler } from "./lib/sentry";

const app: Express = express();

// Sentry request handler MUST be first (captures request context for error reports)
app.use(sentryRequestHandler());

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Global rate limiter: 200 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api", globalLimiter);

// Strict rate limiter for auth endpoints: 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts, please try again later." },
});
app.use("/api/auth/login", authLimiter);

app.use(phiLogger);

app.use("/api", router);

// Sentry error handler MUST be after all routes and before other error handlers
app.use(sentryErrorHandler());

// Global error handler — catches any unhandled errors and returns a clean JSON response
app.use((err: any, _req: any, res: any, _next: any) => {
  logger.error({ err }, "Unhandled error");
  const status = err?.status ?? err?.statusCode ?? 500;
  res.status(status).json({
    error: status < 500 ? (err?.message ?? "Bad request") : "Internal server error",
  });
});

export default app;

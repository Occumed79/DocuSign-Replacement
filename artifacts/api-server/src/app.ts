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

// Render and most production hosts sit behind a reverse proxy.
// This keeps express-rate-limit from erroring on X-Forwarded-For headers.
app.set("trust proxy", 1);

function getAllowedOrigins(): string[] {
  const configured = process.env.ALLOWED_ORIGINS
    ?.split(",")
    .map(origin => origin.trim())
    .filter(Boolean) ?? [];

  if (configured.length > 0) return configured;

  if (process.env.NODE_ENV === "production") {
    return [];
  }

  return [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
  ];
}

const allowedOrigins = getAllowedOrigins();

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
        connectSrc: ["'self'", ...allowedOrigins],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Direct health checks before rate limiting/router mounting.
// Render may use HEAD before GET, so support both.
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.head("/api/health", (_req, res) => {
  res.status(200).end();
});
app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});
app.head("/api/healthz", (_req, res) => {
  res.status(200).end();
});

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

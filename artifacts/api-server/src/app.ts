import crypto from "crypto";
import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { phiLogger } from "./middleware/phi-logger";
import { cspReportHandler } from "./middleware/csp-report";
import { sentryRequestHandler, sentryErrorHandler } from "./lib/sentry";

const app: Express = express();

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
const isProduction = process.env.NODE_ENV === "production";
const cspReportOnly = process.env.CSP_REPORT_ONLY !== "false";
const strictCsp = process.env.STRICT_CSP === "true";

app.use(sentryRequestHandler());

app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString("base64");
  next();
});

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

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=()" );
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  res.setHeader("Origin-Agent-Cluster", "?1");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Document-Policy", "js-profiling=()" );

  if (isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  next();
});

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        scriptSrc: strictCsp
          ? ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`, "'strict-dynamic'"]
          : ["'self'", "'unsafe-inline'"],
        styleSrc: strictCsp
          ? ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`]
          : ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'", ...allowedOrigins],
        frameSrc: ["'none'"],
        manifestSrc: ["'self'"],
        mediaSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"],
        requireTrustedTypesFor: strictCsp ? ["'script'"] : null,
        trustedTypes: strictCsp ? ["default"] : null,
        reportUri: ["/api/security/csp-report"],
        upgradeInsecureRequests: isProduction ? [] : null,
      },
      reportOnly: cspReportOnly,
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: isProduction ? {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    } : false,
    ieNoOpen: true,
    noSniff: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
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
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "X-Step-Up-Token"],
}));

app.use(express.json({ limit: "5mb", type: ["application/json", "application/csp-report"] }));
app.use(express.urlencoded({ extended: true, limit: "5mb", parameterLimit: 100 }));

app.post("/api/security/csp-report", cspReportHandler);

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

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api", globalLimiter);

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

app.use(sentryErrorHandler());

app.use((err: any, _req: any, res: any, _next: any) => {
  logger.error({ err }, "Unhandled error");
  const status = err?.status ?? err?.statusCode ?? 500;
  res.status(status).json({
    error: status < 500 ? (err?.message ?? "Bad request") : "Internal server error",
  });
});

export default app;
import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function sendHealth(res: any) {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
}

router.get("/health", (_req, res) => {
  sendHealth(res);
});

router.get("/healthz", (_req, res) => {
  sendHealth(res);
});

export default router;

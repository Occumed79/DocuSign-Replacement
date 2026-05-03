import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import examTypesRouter from "./exam-types";
import questionsRouter from "./questions";
import casesRouter from "./cases";
import dashboardRouter from "./dashboard";
import securityRouter from "./security";
import signaturesRouter from "./signatures";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(examTypesRouter);
router.use(questionsRouter);
router.use(casesRouter);
router.use(dashboardRouter);
router.use(securityRouter);
router.use(signaturesRouter);

export default router;

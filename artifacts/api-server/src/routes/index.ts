import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import examTypesRouter from "./exam-types";
import questionsRouter from "./questions";
import casesRouter from "./cases";
import dashboardRouter from "./dashboard";
import securityRouter from "./security";
import signaturesRouter from "./signatures";
import mfaRouter from "./mfa";
import webhooksRouter from "./webhooks";
import brandingRouter from "./branding";
import templateVersionsRouter from "./template-versions";
import formProgressRouter from "./form-progress";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(mfaRouter);
router.use(usersRouter);
router.use(examTypesRouter);
router.use(questionsRouter);
router.use(casesRouter);
router.use(dashboardRouter);
router.use(securityRouter);
router.use(signaturesRouter);
router.use(webhooksRouter);
router.use(brandingRouter);
router.use(templateVersionsRouter);
router.use(formProgressRouter);
router.use(analyticsRouter);

export default router;

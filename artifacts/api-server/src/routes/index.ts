import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import examTypesRouter from "./exam-types";
import questionsRouter from "./questions";
import casesRouter from "./cases";
import publicMedicalQuestionnaireRouter from "./public-medical-questionnaire";
import caseReviewWorkspaceRouter from "./case-review-workspace";
import dashboardRouter from "./dashboard";
import securityRouter from "./security";
import systemReadinessRouter from "./system-readiness";
import legacyPdfTemplateBridgeRouter from "./legacy-pdf-template-bridge";
import sourceDocumentsRouter from "./source-documents";
import signaturesRouter from "./signatures";
import signatureVerificationRouter from "./signature-verification";
import certificatesRouter from "./certificates";
import auditExportRouter from "./audit-export";
import integrityLedgerRouter from "./integrity-ledger";
import fraudReviewRouter from "./fraud-review";
import securityOperationsRouter from "./security-operations";
import webauthnRouter from "./webauthn";
import mfaRouter from "./mfa";
import webhooksRouter from "./webhooks";
import brandingRouter from "./branding";
import templateVersionsRouter from "./template-versions";
import formProgressRouter from "./form-progress";
import analyticsRouter from "./analytics";
import setupRouter from "./setup";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(mfaRouter);
router.use(usersRouter);
router.use(examTypesRouter);
router.use(questionsRouter);
router.use(casesRouter);
router.use(publicMedicalQuestionnaireRouter);
router.use(caseReviewWorkspaceRouter);
router.use(dashboardRouter);
router.use(securityRouter);
router.use(systemReadinessRouter);
// Promote the old HTML-embedded PDF-template representation into the exact
// source-document request fields before sourceDocumentsRouter evaluates it.
router.use(legacyPdfTemplateBridgeRouter);
// Exact-source PDF routes intentionally run before the legacy signature router.
// They intercept only requests carrying/persisting a real source PDF; all HTML
// document behavior continues through signaturesRouter unchanged.
router.use(sourceDocumentsRouter);
router.use(signaturesRouter);
router.use(signatureVerificationRouter);
router.use(certificatesRouter);
router.use(auditExportRouter);
router.use(integrityLedgerRouter);
router.use(fraudReviewRouter);
router.use(securityOperationsRouter);
router.use(webauthnRouter);
router.use(webhooksRouter);
router.use(brandingRouter);
router.use(templateVersionsRouter);
router.use(formProgressRouter);
router.use(analyticsRouter);
router.use(setupRouter);

export default router;

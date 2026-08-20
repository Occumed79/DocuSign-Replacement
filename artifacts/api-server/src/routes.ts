import router from "./routes/index";
import medicalSourceFormsRouter from "./routes/medical-source-forms";

// Public deployment fingerprint. Render provides these metadata variables at
// runtime; exposing them here lets support confirm which service/branch/commit
// is actually serving traffic without exposing secrets.
router.get("/deploy-info", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({
    provider: process.env.RENDER === "true" ? "render" : "other",
    serviceType: process.env.RENDER_SERVICE_TYPE ?? null,
    serviceName: process.env.RENDER_SERVICE_NAME ?? null,
    repo: process.env.RENDER_GIT_REPO_SLUG ?? null,
    branch: process.env.RENDER_GIT_BRANCH ?? null,
    commit: process.env.RENDER_GIT_COMMIT ?? null,
    externalHostname: process.env.RENDER_EXTERNAL_HOSTNAME ?? null,
  });
});

// `app.ts` resolves `./routes` through this package-level shim. Preserve the
// established router stack verbatim, then layer verified official-source-form
// administration/rendering routes on top.
router.use(medicalSourceFormsRouter);

export default router;

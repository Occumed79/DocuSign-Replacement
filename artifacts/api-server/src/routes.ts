import router from "./routes/index";
import medicalSourceFormsRouter from "./routes/medical-source-forms";

// `app.ts` resolves `./routes` through this package-level shim. Preserve the
// established router stack verbatim, then layer verified official-source-form
// administration/rendering routes on top.
router.use(medicalSourceFormsRouter);

export default router;

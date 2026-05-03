import { Router, type IRouter } from "express";
import { db, examTypesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/exam-types", async (_req, res): Promise<void> => {
  const examTypes = await db.select().from(examTypesTable).orderBy(examTypesTable.id);
  res.json(examTypes.map(et => ({
    id: et.id,
    name: et.name,
    description: et.description,
    slug: et.slug,
  })));
});

export default router;

import { Router, type IRouter } from "express";
import { db, casesTable, examTypesTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  // Total cases
  const allCases = await db
    .select({ case: casesTable, examType: examTypesTable })
    .from(casesTable)
    .leftJoin(examTypesTable, sql`${casesTable.examTypeId} = ${examTypesTable.id}`)
    .orderBy(desc(casesTable.updatedAt));

  const totalCases = allCases.length;

  // Cases by status
  const statusMap = new Map<string, number>();
  for (const { case: c } of allCases) {
    statusMap.set(c.status, (statusMap.get(c.status) ?? 0) + 1);
  }
  const casesByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

  // Cases by exam type
  const examTypeMap = new Map<string, number>();
  for (const { examType } of allCases) {
    const name = examType?.name ?? "Unknown";
    examTypeMap.set(name, (examTypeMap.get(name) ?? 0) + 1);
  }
  const casesByExamType = Array.from(examTypeMap.entries()).map(([examTypeName, count]) => ({ examTypeName, count }));

  // Recent 5 cases
  const recentCases = allCases.slice(0, 5).map(({ case: c, examType }) => ({
    id: c.id,
    patientName: c.patientName,
    patientDob: c.patientDob ?? null,
    examTypeId: c.examTypeId,
    examTypeName: examType?.name ?? "Unknown",
    status: c.status,
    completionPercent: c.completionPercent,
    createdById: c.createdById ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  // Avg completion
  const avgCompletionPercent = totalCases > 0
    ? Math.round(allCases.reduce((sum, { case: c }) => sum + c.completionPercent, 0) / totalCases)
    : 0;

  res.json({
    totalCases,
    casesByStatus,
    casesByExamType,
    recentCases,
    avgCompletionPercent,
  });
});

export default router;

import { db, pool } from "@workspace/db";
import {
  usersTable,
  examTypesTable,
  questionsTable,
  casesTable,
} from "@workspace/db/schema";
import crypto from "crypto";
import { sql } from "drizzle-orm";

function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + "packetpath_salt")
    .digest("hex");
}

async function seed() {
  console.log("🌱 Seeding database...\n");

  // ── Users ──────────────────────────────────────────────────────────────────
  const passwordHash = hashPassword("admin123");

  const users = await db
    .insert(usersTable)
    .values([
      { name: "Admin User", email: "admin@occumed.com", passwordHash, role: "admin" },
      { name: "Exam QA", email: "examqa@occumed.com", passwordHash, role: "examqa" },
      { name: "Reviewer", email: "reviewer@occumed.com", passwordHash, role: "reviewer" },
    ])
    .onConflictDoNothing()
    .returning();
  console.log(`  Users: ${users.length} created`);

  // ── Exam Types ─────────────────────────────────────────────────────────────
  const examTypes = await db
    .insert(examTypesTable)
    .values([
      {
        name: "Deployment Packet",
        slug: "deployment",
        description: "Full deployment physical packet including medical clearance, dental, labs, and immunizations",
      },
      {
        name: "Traditional Packet",
        slug: "traditional",
        description: "Standard occupational health exam packet for pre-employment and annual physicals",
      },
      {
        name: "Dental Only",
        slug: "dental",
        description: "Dental exam only — panoramic X-ray, clinical exam, and clearance",
      },
      {
        name: "Labs Only",
        slug: "labs",
        description: "Laboratory testing only — blood draw, urinalysis, and results reporting",
      },
    ])
    .onConflictDoNothing()
    .returning();
  console.log(`  Exam Types: ${examTypes.length} created`);

  const deploymentId = examTypes.find((e) => e.slug === "deployment")?.id ?? 1;
  const traditionalId = examTypes.find((e) => e.slug === "traditional")?.id ?? 2;
  const dentalId = examTypes.find((e) => e.slug === "dental")?.id ?? 3;
  const labsId = examTypes.find((e) => e.slug === "labs")?.id ?? 4;
  const allIds = [deploymentId, traditionalId, dentalId, labsId];

  // ── Questions ──────────────────────────────────────────────────────────────
  const questions = await db
    .insert(questionsTable)
    .values([
      // Patient Demographics
      { text: "Patient full legal name", answerType: "text", section: "Patient Demographics", orderIndex: 1, examTypeIds: allIds, required: true },
      { text: "Date of birth", answerType: "date", section: "Patient Demographics", orderIndex: 2, examTypeIds: allIds, required: true },
      { text: "Social Security Number (last 4)", answerType: "text", section: "Patient Demographics", orderIndex: 3, examTypeIds: allIds, required: true, helpText: "Last 4 digits only for identification" },
      { text: "Gender", answerType: "dropdown", section: "Patient Demographics", orderIndex: 4, examTypeIds: allIds, required: true, options: ["Male", "Female", "Non-binary", "Prefer not to say"] },
      { text: "Phone number", answerType: "text", section: "Patient Demographics", orderIndex: 5, examTypeIds: allIds, required: true },
      { text: "Email address", answerType: "text", section: "Patient Demographics", orderIndex: 6, examTypeIds: allIds, required: false },

      // Employment Info
      { text: "Employer / Company name", answerType: "text", section: "Employment Information", orderIndex: 7, examTypeIds: allIds, required: true },
      { text: "Job title / position", answerType: "text", section: "Employment Information", orderIndex: 8, examTypeIds: allIds, required: true },
      { text: "Deployment location", answerType: "text", section: "Employment Information", orderIndex: 9, examTypeIds: [deploymentId], required: true },
      { text: "Expected deployment duration (months)", answerType: "number", section: "Employment Information", orderIndex: 10, examTypeIds: [deploymentId], required: true },

      // Medical History
      { text: "Do you have any current medical conditions?", answerType: "yes_no", section: "Medical History", orderIndex: 11, examTypeIds: [deploymentId, traditionalId], required: true, triggerValue: "yes" },
      { text: "Please describe your current medical conditions", answerType: "text", section: "Medical History", orderIndex: 12, examTypeIds: [deploymentId, traditionalId], required: true },
      { text: "Are you currently taking any medications?", answerType: "yes_no", section: "Medical History", orderIndex: 13, examTypeIds: [deploymentId, traditionalId], required: true, triggerValue: "yes" },
      { text: "List all current medications and dosages", answerType: "text", section: "Medical History", orderIndex: 14, examTypeIds: [deploymentId, traditionalId], required: true },
      { text: "Do you have any drug allergies?", answerType: "yes_no", section: "Medical History", orderIndex: 15, examTypeIds: allIds, required: true, triggerValue: "yes" },
      { text: "List all drug allergies", answerType: "text", section: "Medical History", orderIndex: 16, examTypeIds: allIds, required: true },
      { text: "Have you had any surgeries in the past 5 years?", answerType: "yes_no", section: "Medical History", orderIndex: 17, examTypeIds: [deploymentId, traditionalId], required: true, triggerValue: "yes" },
      { text: "Describe surgeries and dates", answerType: "text", section: "Medical History", orderIndex: 18, examTypeIds: [deploymentId, traditionalId], required: true },

      // Vitals
      { text: "Height (inches)", answerType: "number", section: "Vitals", orderIndex: 19, examTypeIds: [deploymentId, traditionalId], required: true },
      { text: "Weight (lbs)", answerType: "number", section: "Vitals", orderIndex: 20, examTypeIds: [deploymentId, traditionalId], required: true },
      { text: "Blood pressure (systolic/diastolic)", answerType: "text", section: "Vitals", orderIndex: 21, examTypeIds: [deploymentId, traditionalId], required: true, helpText: "e.g. 120/80" },
      { text: "Resting heart rate (bpm)", answerType: "number", section: "Vitals", orderIndex: 22, examTypeIds: [deploymentId, traditionalId], required: true },
      { text: "Vision — right eye (20/__)", answerType: "text", section: "Vitals", orderIndex: 23, examTypeIds: [deploymentId, traditionalId], required: true },
      { text: "Vision — left eye (20/__)", answerType: "text", section: "Vitals", orderIndex: 24, examTypeIds: [deploymentId, traditionalId], required: true },

      // Dental
      { text: "Date of last dental exam", answerType: "date", section: "Dental", orderIndex: 25, examTypeIds: [deploymentId, dentalId], required: true },
      { text: "Panoramic X-ray taken?", answerType: "yes_no", section: "Dental", orderIndex: 26, examTypeIds: [deploymentId, dentalId], required: true },
      { text: "Dental classification", answerType: "dropdown", section: "Dental", orderIndex: 27, examTypeIds: [deploymentId, dentalId], required: true, options: ["Class 1 — Fit", "Class 2 — Needs minor treatment", "Class 3 — Needs significant treatment", "Class 4 — Unfit"] },
      { text: "Dental notes / treatment plan", answerType: "text", section: "Dental", orderIndex: 28, examTypeIds: [deploymentId, dentalId], required: false },

      // Labs
      { text: "CBC — WBC count", answerType: "text", section: "Laboratory", orderIndex: 29, examTypeIds: [deploymentId, labsId], required: true },
      { text: "CBC — Hemoglobin", answerType: "text", section: "Laboratory", orderIndex: 30, examTypeIds: [deploymentId, labsId], required: true },
      { text: "CMP — Glucose", answerType: "text", section: "Laboratory", orderIndex: 31, examTypeIds: [deploymentId, labsId], required: true },
      { text: "CMP — Creatinine", answerType: "text", section: "Laboratory", orderIndex: 32, examTypeIds: [deploymentId, labsId], required: true },
      { text: "Urinalysis — Results", answerType: "dropdown", section: "Laboratory", orderIndex: 33, examTypeIds: [deploymentId, labsId], required: true, options: ["Normal", "Abnormal — see notes", "Pending"] },
      { text: "Drug screen result", answerType: "dropdown", section: "Laboratory", orderIndex: 34, examTypeIds: [deploymentId, traditionalId, labsId], required: true, options: ["Negative", "Positive", "Pending", "Inconclusive"] },

      // Clearance
      { text: "Overall medical clearance", answerType: "dropdown", section: "Clearance", orderIndex: 35, examTypeIds: [deploymentId, traditionalId], required: true, options: ["Cleared — no restrictions", "Cleared — with restrictions", "Temporarily unfit", "Permanently unfit"] },
      { text: "Clearance notes / restrictions", answerType: "text", section: "Clearance", orderIndex: 36, examTypeIds: [deploymentId, traditionalId], required: false },
    ])
    .onConflictDoNothing()
    .returning();
  console.log(`  Questions: ${questions.length} created`);

  // Set up follow-up question links
  const qMap = new Map(questions.map((q) => [q.text, q.id]));

  const followUps: [string, string][] = [
    ["Do you have any current medical conditions?", "Please describe your current medical conditions"],
    ["Are you currently taking any medications?", "List all current medications and dosages"],
    ["Do you have any drug allergies?", "List all drug allergies"],
    ["Have you had any surgeries in the past 5 years?", "Describe surgeries and dates"],
  ];

  for (const [parent, child] of followUps) {
    const parentId = qMap.get(parent);
    const childId = qMap.get(child);
    if (parentId && childId) {
      await db
        .update(questionsTable)
        .set({ followUpIds: [childId] })
        .where(sql`${questionsTable.id} = ${parentId}`);
    }
  }
  console.log(`  Follow-up links: ${followUps.length} configured`);

  // ── Sample Cases ───────────────────────────────────────────────────────────
  const adminId = users.find((u) => u.email === "admin@occumed.com")?.id ?? 1;

  const cases = await db
    .insert(casesTable)
    .values([
      { patientName: "John Smith", patientDob: "1988-03-15", examTypeId: deploymentId, status: "in_progress", completionPercent: 45, createdById: adminId },
      { patientName: "Sarah Johnson", patientDob: "1995-07-22", examTypeId: traditionalId, status: "complete", completionPercent: 100, createdById: adminId },
      { patientName: "Michael Davis", patientDob: "1979-11-30", examTypeId: dentalId, status: "draft", completionPercent: 0, createdById: adminId },
      { patientName: "Emily Brown", patientDob: "2001-01-10", examTypeId: labsId, status: "in_progress", completionPercent: 60, createdById: adminId },
      { patientName: "Robert Wilson", patientDob: "1990-06-05", examTypeId: deploymentId, status: "submitted", completionPercent: 100, createdById: adminId },
    ])
    .onConflictDoNothing()
    .returning();
  console.log(`  Cases: ${cases.length} created`);

  console.log("\n✅ Seed complete!");
  console.log("\nLogin credentials:");
  console.log("  admin@occumed.com   / admin123  (admin)");
  console.log("  examqa@occumed.com  / admin123  (examqa)");
  console.log("  reviewer@occumed.com/ admin123  (reviewer)\n");

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

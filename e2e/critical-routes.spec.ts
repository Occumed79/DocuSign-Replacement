import { expect, test, type Page } from "@playwright/test";

async function failOnPageErrors(page: Page) {
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  return () => expect(pageErrors, `Unexpected page errors: ${pageErrors.join(" | ")}`).toEqual([]);
}

test("login page mounts as real UI instead of a blank shell", async ({ page }) => {
  const assertNoErrors = await failOnPageErrors(page);
  await page.route("**/api/setup/status", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ initialized: true }) }));

  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "PacketPath" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.locator("body")).not.toHaveText(/^\s*$/);
  assertNoErrors();
});

test("public signer recognizes and presents an exact-source PDF", async ({ page }) => {
  const assertNoErrors = await failOnPageErrors(page);

  await page.route("**/api/sign/test-sign-token/source-document", async route => {
    if (route.request().method() === "HEAD") {
      await route.fulfill({ status: 200, headers: { "content-type": "application/pdf" }, body: "" });
      return;
    }
    await route.fulfill({ status: 200, headers: { "content-type": "application/pdf" }, body: "%PDF-1.4\n% smoke-test source\n%%EOF" });
  });
  await page.route("**/api/sign/test-sign-token/view", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ message: "Viewed" }) }));
  await page.route("**/api/sign/test-sign-token", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      requestId: 99,
      requestTitle: "Provider Service Agreement",
      message: "Please review and sign.",
      documentContent: "<p>Fallback should not replace the PDF.</p>",
      recipientName: "Test Recipient",
      recipientEmail: "recipient@example.com",
      recipientRole: "signer",
      status: "pending",
      organizationName: "Occu-Med Occupational Health",
    }),
  }));

  await page.goto("/sign/test-sign-token");

  await expect(page.getByRole("heading", { name: "Review and sign your document" })).toBeVisible();
  await expect(page.getByText("Original PDF source")).toBeVisible();
  await expect(page.getByTitle("Original PDF document to sign")).toBeVisible();
  await expect(page.getByRole("button", { name: /Continue/ })).toBeVisible();
  assertNoErrors();
});

test("public medical questionnaire preserves source question then reveals adaptive detail", async ({ page }) => {
  const assertNoErrors = await failOnPageErrors(page);
  const sourceQuestion = "Have you ever had asthma?";
  const followUpQuestion = "How is your asthma currently being managed?";

  await page.route("**/api/medical-questionnaire/test-medical-token", async route => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        maskedName: "T*** R********",
        examTypeName: "Occu-Med Medical History Questionnaire",
        requiresDob: true,
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      }),
    });
  });
  await page.route("**/api/medical-questionnaire/test-medical-token/verify", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      sessionToken: "verified-session",
      sessionExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      caseId: 42,
      patientName: "Test Recipient",
      examTypeName: "Occu-Med Medical History Questionnaire",
    }),
  }));
  await page.route("**/api/medical-questionnaire/test-medical-token/questions", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      questions: [
        {
          id: 1,
          text: sourceQuestion,
          answerType: "yes_no",
          required: true,
          section: "Medical History",
          orderIndex: 1,
          options: [],
          triggerValue: null,
          followUpIds: [2],
          helpText: null,
        },
        {
          id: 2,
          text: followUpQuestion,
          answerType: "textarea",
          required: true,
          section: "Medical History",
          orderIndex: 2,
          options: [],
          triggerValue: "yes",
          followUpIds: [],
          helpText: null,
        },
      ],
      answers: [],
      visibleQuestionIds: [1],
      completionPercent: 0,
      status: "draft",
    }),
  }));
  await page.route("**/api/medical-questionnaire/test-medical-token/answers", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ answers: [], completionPercent: 50 }),
  }));

  await page.goto("/questionnaire/test-medical-token");
  await expect(page.getByRole("heading", { name: "Medical History Questionnaire" })).toBeVisible();
  await page.locator('input[type="date"]').fill("1990-01-15");
  await page.getByRole("button", { name: "Continue securely" }).click();

  await expect(page.getByRole("heading", { name: sourceQuestion })).toBeVisible();
  await page.getByRole("button", { name: "yes" }).click();
  await page.getByRole("button", { name: /Continue/ }).click();

  await expect(page.getByRole("heading", { name: followUpQuestion })).toBeVisible();
  await expect(page.getByText("Additional detail")).toBeVisible();
  assertNoErrors();
});

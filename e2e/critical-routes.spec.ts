import { expect, test, type Page, type Route } from "@playwright/test";

async function failOnPageErrors(page: Page) {
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  return () => expect(pageErrors, `Unexpected page errors: ${pageErrors.join(" | ")}`).toEqual([]);
}

function pathOf(route: Route): string {
  return new URL(route.request().url()).pathname;
}

// Small, valid one-page PDF with a correct xref table. Keeping this inline
// avoids asking the browser PDF viewer to parse the intentionally malformed
// placeholder bytes that the first smoke test used.
const MINIMAL_PDF = Buffer.from(
  "JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSA0IDAgUiA+PiA+PiAvQ29udGVudHMgNSAwIFIgPj4KZW5kb2JqCjQgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iago1IDAgb2JqCjw8IC9MZW5ndGggNDQgPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgo3MiA3MjAgVGQKKE9yaWdpbmFsIFBERikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAyNDggMDAwMDAgbiAKMDAwMDAwMDMyNSAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDYgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjQxOQolJUVPRgo=",
  "base64",
);

test("login page mounts as real UI instead of a blank shell", async ({ page }) => {
  const assertNoErrors = await failOnPageErrors(page);
  await page.route("**/api/setup/status", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ initialized: true }) }));

  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "PacketPath" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toHaveText(/^\s*$/);
  assertNoErrors();
});

test("public signer recognizes and presents an exact-source PDF", async ({ page }) => {
  const assertNoErrors = await failOnPageErrors(page);

  await page.route("**/api/sign/test-sign-token**", async route => {
    const path = pathOf(route);
    const method = route.request().method();

    if (path === "/api/sign/test-sign-token/source-document") {
      if (method === "HEAD") {
        await route.fulfill({ status: 200, headers: { "content-type": "application/pdf", "content-length": String(MINIMAL_PDF.length) } });
      } else {
        await route.fulfill({ status: 200, headers: { "content-type": "application/pdf", "content-length": String(MINIMAL_PDF.length) }, body: MINIMAL_PDF });
      }
      return;
    }

    if (path === "/api/sign/test-sign-token/view" && method === "POST") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ message: "Viewed" }) });
      return;
    }

    if (path === "/api/sign/test-sign-token" && method === "GET") {
      await route.fulfill({
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
      });
      return;
    }

    await route.abort("failed");
  });

  await page.goto("/sign/test-sign-token");

  await expect(page.getByRole("heading", { name: "Review and sign your document" })).toBeVisible();
  await expect(page.getByText("Original PDF source", { exact: true })).toBeVisible();
  await expect(page.getByTitle("Original PDF document to sign")).toBeVisible();
  await expect(page.getByRole("button", { name: /Continue/ })).toBeVisible();
  assertNoErrors();
});

test("public medical questionnaire preserves source question then reveals adaptive detail", async ({ page }) => {
  const assertNoErrors = await failOnPageErrors(page);
  const sourceQuestion = "Have you ever had asthma?";
  const followUpQuestion = "How is your asthma currently being managed?";

  await page.route("**/api/medical-questionnaire/test-medical-token**", async route => {
    const path = pathOf(route);
    const method = route.request().method();

    if (path === "/api/medical-questionnaire/test-medical-token" && method === "GET") {
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
      return;
    }

    if (path === "/api/medical-questionnaire/test-medical-token/verify" && method === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sessionToken: "verified-session",
          sessionExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
          caseId: 42,
          patientName: "Test Recipient",
          examTypeName: "Occu-Med Medical History Questionnaire",
        }),
      });
      return;
    }

    if (path === "/api/medical-questionnaire/test-medical-token/questions" && method === "GET") {
      await route.fulfill({
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
      });
      return;
    }

    if (path === "/api/medical-questionnaire/test-medical-token/answers" && method === "PUT") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ answers: [], completionPercent: 50 }),
      });
      return;
    }

    await route.abort("failed");
  });

  await page.goto("/questionnaire/test-medical-token");
  await expect(page.getByRole("heading", { name: "Medical History Questionnaire" })).toBeVisible();
  await page.locator('input[type="date"]').fill("1990-01-15");
  await page.getByRole("button", { name: "Continue securely", exact: true }).click();

  await expect(page.getByRole("heading", { name: sourceQuestion })).toBeVisible();
  await page.getByRole("button", { name: /yes/i, exact: true }).click();
  await page.getByRole("button", { name: /Continue/ }).click();

  await expect(page.getByRole("heading", { name: followUpQuestion })).toBeVisible();
  await expect(page.getByText(/^Additional detail/)).toBeVisible();
  assertNoErrors();
});

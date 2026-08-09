import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  inspectMedicalSourcePdf,
  renderMappedMedicalSourcePdf,
  validateMedicalSourceMapping,
  type MedicalSourceMapping,
} from "./medical-source-pdf";

async function makeAcroFormPdf() {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const form = pdf.getForm();
  const yes = form.createCheckBox("Q1_YES");
  const no = form.createCheckBox("Q1_NO");
  const detail = form.createTextField("DETAIL");
  yes.addToPage(page, { x: 72, y: 650, width: 14, height: 14 });
  no.addToPage(page, { x: 120, y: 650, width: 14, height: 14 });
  detail.addToPage(page, { x: 72, y: 600, width: 320, height: 24 });
  return pdf.save({ useObjectStreams: false });
}

describe("verified medical source PDF mapping", () => {
  it("inspects exact AcroForm field names", async () => {
    const bytes = await makeAcroFormPdf();
    const inspection = await inspectMedicalSourcePdf(bytes);
    expect(inspection.pageCount).toBe(1);
    expect(inspection.fields.map(field => field.name).sort()).toEqual(["DETAIL", "Q1_NO", "Q1_YES"]);
  });

  it("rejects an AcroForm mapping that names a field not present in the source PDF", async () => {
    const bytes = await makeAcroFormPdf();
    await expect(validateMedicalSourceMapping({
      bytes,
      strategy: "acroform",
      allowedSourceKeys: new Set(["q1"]),
      mapping: { q1: { kind: "checkbox_pair", yesField: "Q1_YES", noField: "MISSING_NO" } },
    })).rejects.toThrow(/does not exist/i);
  });

  it("rejects mapping keys that do not belong to the source questionnaire", async () => {
    const bytes = await makeAcroFormPdf();
    await expect(validateMedicalSourceMapping({
      bytes,
      strategy: "acroform",
      allowedSourceKeys: new Set(["q1"]),
      mapping: { something_else: { kind: "text", field: "DETAIL" } },
    })).rejects.toThrow(/unknown source question key/i);
  });

  it("rejects overlay coordinates outside the verified page", async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage([612, 792]);
    const bytes = await pdf.save();
    await expect(validateMedicalSourceMapping({
      bytes,
      strategy: "overlay",
      allowedSourceKeys: new Set(["q1"]),
      mapping: { q1: { kind: "overlay", page: 0, x: 600, y: 100, width: 100 } },
    })).rejects.toThrow(/outside page/i);
  });

  it("fills mapped yes/no fields while preserving the source page count", async () => {
    const bytes = await makeAcroFormPdf();
    const mapping: MedicalSourceMapping = {
      q1: { kind: "checkbox_pair", yesField: "Q1_YES", noField: "Q1_NO" },
      detail: { kind: "text", field: "DETAIL" },
    };
    await validateMedicalSourceMapping({
      bytes,
      strategy: "acroform",
      allowedSourceKeys: new Set(["q1", "detail"]),
      mapping,
    });
    const rendered = await renderMappedMedicalSourcePdf({
      bytes,
      mapping,
      answersBySourceKey: new Map([["q1", "yes"], ["detail", "No current symptoms"]]),
      flatten: false,
    });
    const output = await PDFDocument.load(rendered);
    expect(output.getPageCount()).toBe(1);
    expect(output.getForm().getCheckBox("Q1_YES").isChecked()).toBe(true);
    expect(output.getForm().getCheckBox("Q1_NO").isChecked()).toBe(false);
    expect(output.getForm().getTextField("DETAIL").getText()).toBe("No current symptoms");
  });
});

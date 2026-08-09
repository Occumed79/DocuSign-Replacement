import PDFDocument from "pdfkit";
import type { Readable } from "stream";
import type { MedicalHistoryResponseGroup } from "./medical-history-review";

export interface MedicalHistoryResponsePdfInput {
  caseId: number;
  patientName: string;
  patientDob: string | null;
  examTypeName: string;
  status: string;
  generatedAt: Date;
  groups: MedicalHistoryResponseGroup[];
}

function displayAnswer(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "Not answered";
  if (trimmed.toLowerCase() === "yes") return "Yes";
  if (trimmed.toLowerCase() === "no") return "No";
  return trimmed.replace(/\|\|/g, ", ");
}

export function generateMedicalHistoryResponsePdf(input: MedicalHistoryResponsePdfInput): Readable {
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 54, bottom: 54, left: 54, right: 54 },
    info: {
      Title: `${input.examTypeName} — Medical History Response Record`,
      Author: "Occu-Med PacketPath",
      Subject: "Medical History Questionnaire Response Record",
      Creator: "PacketPath",
    },
  });

  const pageWidth = doc.page.width - 108;
  const dark = "#0F172A";
  const muted = "#64748B";
  const accent = "#527b78";
  const border = "#D7E0DE";
  const detailBg = "#F4F8F7";
  let y = 54;

  const ensure = (height: number) => {
    if (y + height <= doc.page.height - 54) return;
    doc.addPage();
    y = 54;
  };

  const divider = () => {
    doc.moveTo(54, y).lineTo(doc.page.width - 54, y).strokeColor(border).lineWidth(0.7).stroke();
  };

  doc.fillColor(accent).font("Helvetica-Bold").fontSize(19)
    .text("Medical History Response Record", 54, y, { width: pageWidth });
  y += 26;
  doc.fillColor(dark).font("Helvetica-Bold").fontSize(12)
    .text(input.examTypeName, 54, y, { width: pageWidth });
  y += 21;
  divider();
  y += 14;

  const metadata: Array<[string, string]> = [
    ["Examinee", input.patientName],
    ["Date of Birth", input.patientDob || "Not recorded"],
    ["Case ID", String(input.caseId)],
    ["Case Status", input.status],
    ["Generated", input.generatedAt.toLocaleString("en-US")],
  ];
  for (const [label, value] of metadata) {
    doc.fillColor(muted).font("Helvetica-Bold").fontSize(7.5).text(label.toUpperCase(), 54, y, { width: 105 });
    doc.fillColor(dark).font("Helvetica").fontSize(9.5).text(value, 165, y - 1, { width: pageWidth - 111 });
    y += 17;
  }

  y += 6;
  doc.fillColor(muted).font("Helvetica-Oblique").fontSize(8.5).text(
    "This response record preserves the questionnaire's source question wording and presents adaptive follow-up responses separately. It is not a substitute for the official source-form layout unless explicitly identified as such.",
    54,
    y,
    { width: pageWidth, lineGap: 2 },
  );
  y += doc.heightOfString(
    "This response record preserves the questionnaire's source question wording and presents adaptive follow-up responses separately. It is not a substitute for the official source-form layout unless explicitly identified as such.",
    { width: pageWidth, lineGap: 2 },
  ) + 18;

  let currentSection = "";
  for (const group of input.groups) {
    if (group.section !== currentSection) {
      ensure(40);
      currentSection = group.section;
      doc.fillColor(accent).font("Helvetica-Bold").fontSize(11).text(currentSection, 54, y, { width: pageWidth });
      y += 18;
      divider();
      y += 10;
    }

    const sourceQuestionHeight = doc.font("Helvetica-Bold").fontSize(9.5)
      .heightOfString(group.sourceQuestionText, { width: pageWidth - 28, lineGap: 1.5 });
    const sourceAnswer = displayAnswer(group.sourceAnswer);
    const sourceAnswerHeight = doc.font("Helvetica").fontSize(9.5)
      .heightOfString(sourceAnswer, { width: pageWidth - 28, lineGap: 1.5 });
    ensure(sourceQuestionHeight + sourceAnswerHeight + 34);

    doc.fillColor(dark).font("Helvetica-Bold").fontSize(9.5)
      .text(group.sourceQuestionText, 54, y, { width: pageWidth - 28, lineGap: 1.5 });
    y += sourceQuestionHeight + 5;
    doc.fillColor(accent).font("Helvetica-Bold").fontSize(8).text("RESPONSE", 54, y);
    y += 12;
    doc.fillColor(dark).font("Helvetica").fontSize(9.5)
      .text(sourceAnswer, 54, y, { width: pageWidth - 28, lineGap: 1.5 });
    y += sourceAnswerHeight + 10;

    if (group.followUps.length > 0) {
      for (const followUp of group.followUps) {
        const indent = Math.min(18 * followUp.depth, 54);
        const detailWidth = pageWidth - indent - 24;
        const qHeight = doc.font("Helvetica-Bold").fontSize(8.7)
          .heightOfString(followUp.questionText, { width: detailWidth, lineGap: 1.2 });
        const answer = displayAnswer(followUp.answer);
        const aHeight = doc.font("Helvetica").fontSize(9)
          .heightOfString(answer, { width: detailWidth, lineGap: 1.2 });
        const blockHeight = qHeight + aHeight + 31;
        ensure(blockHeight + 6);
        doc.roundedRect(54 + indent, y, pageWidth - indent, blockHeight, 5).fillColor(detailBg).fill();
        doc.fillColor(accent).font("Helvetica-Bold").fontSize(7.5)
          .text("ADDITIONAL DETAIL", 64 + indent, y + 8, { width: detailWidth });
        doc.fillColor(dark).font("Helvetica-Bold").fontSize(8.7)
          .text(followUp.questionText, 64 + indent, y + 20, { width: detailWidth, lineGap: 1.2 });
        doc.fillColor(dark).font("Helvetica").fontSize(9)
          .text(answer, 64 + indent, y + 23 + qHeight, { width: detailWidth, lineGap: 1.2 });
        y += blockHeight + 6;
      }
    }

    y += 7;
    ensure(12);
    divider();
    y += 12;
  }

  doc.end();
  return doc;
}

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { MedicalHistoryResponseGroup } from "./medical-history-review";

function clean(value: string): string {
  return value.replace(/\|\|/g, ", ").trim();
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) current = candidate;
    else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

/**
 * Preserve the official source pages as the first pages and append adaptive
 * follow-up responses separately. We never force applicant clarification into
 * an unrelated official-form box just because one happens to be available.
 */
export async function appendMedicalAdditionalDetails(params: {
  sourcePdf: Uint8Array;
  examTypeName: string;
  patientName: string;
  caseId: number;
  groups: MedicalHistoryResponseGroup[];
}): Promise<Uint8Array> {
  const detailGroups = params.groups
    .map(group => ({
      ...group,
      followUps: group.followUps.filter(item => clean(item.answer).length > 0),
    }))
    .filter(group => group.followUps.length > 0);

  if (detailGroups.length === 0) return params.sourcePdf;

  const document = await PDFDocument.load(params.sourcePdf);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 612;
  const pageHeight = 792;
  const left = 54;
  const right = 54;
  const usable = pageWidth - left - right;
  const dark = rgb(0.06, 0.09, 0.13);
  const muted = rgb(0.36, 0.42, 0.45);
  const accent = rgb(0.32, 0.48, 0.47);
  let page = document.addPage([pageWidth, pageHeight]);
  let y = pageHeight - 58;

  const newPage = () => {
    page = document.addPage([pageWidth, pageHeight]);
    y = pageHeight - 58;
  };
  const ensure = (height: number) => {
    if (y - height < 54) newPage();
  };
  const drawLines = (lines: string[], x: number, size: number, font = regular, color = dark, lineGap = 4) => {
    for (const line of lines) {
      page.drawText(line, { x, y, size, font, color, maxWidth: usable - (x - left) });
      y -= size + lineGap;
    }
  };

  page.drawText("Additional Medical History Details", { x: left, y, size: 18, font: bold, color: accent });
  y -= 26;
  page.drawText(params.examTypeName, { x: left, y, size: 10, font: bold, color: dark, maxWidth: usable });
  y -= 17;
  page.drawText(`${params.patientName}  ·  Case ${params.caseId}`, { x: left, y, size: 9, font: regular, color: muted });
  y -= 24;
  drawLines(
    wrapText("The following responses are adaptive clarification associated with the source question shown. They are presented separately so the original form wording and layout remain intact.", 96),
    left,
    8.5,
    regular,
    muted,
    3,
  );
  y -= 10;

  for (const group of detailGroups) {
    const sourceLines = wrapText(group.sourceQuestionText, 82);
    const requiredHeight = sourceLines.length * 14 + group.followUps.length * 52 + 24;
    ensure(Math.min(requiredHeight, 180));

    page.drawRectangle({ x: left, y: y - 4, width: usable, height: 1, color: rgb(0.84, 0.88, 0.87) });
    y -= 16;
    page.drawText(group.section, { x: left, y, size: 7.5, font: bold, color: accent });
    y -= 13;
    drawLines(sourceLines, left, 9.5, bold, dark, 3);
    const sourceAnswer = clean(group.sourceAnswer);
    if (sourceAnswer) {
      page.drawText(`Source response: ${sourceAnswer}`, { x: left, y, size: 8.5, font: regular, color: muted, maxWidth: usable });
      y -= 16;
    }

    for (const followUp of group.followUps) {
      const questionLines = wrapText(followUp.questionText, 76);
      const answerLines = wrapText(clean(followUp.answer), 82);
      const height = 12 + questionLines.length * 12 + answerLines.length * 12 + 12;
      ensure(height + 12);
      const indent = Math.min(12 + Math.max(0, followUp.depth - 1) * 10, 36);
      page.drawText("ADDITIONAL DETAIL", { x: left + indent, y, size: 7, font: bold, color: accent });
      y -= 12;
      drawLines(questionLines, left + indent, 8.5, bold, dark, 2.5);
      drawLines(answerLines, left + indent, 9, regular, dark, 3);
      y -= 8;
    }

    y -= 6;
  }

  return document.save({ useObjectStreams: false });
}

import crypto from "crypto";
import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
  StandardFonts,
  rgb,
} from "pdf-lib";

export type MedicalSourcePdfField = {
  name: string;
  type: string;
  options?: string[];
};

export type MedicalSourceFieldDescriptor =
  | { kind: "text"; field: string }
  | { kind: "checkbox_pair"; yesField: string; noField: string; unsureField?: string }
  | { kind: "checkbox"; field: string; checkedWhen: string[] }
  | { kind: "radio"; field: string; yesValue: string; noValue: string; unsureValue?: string }
  | { kind: "overlay"; page: number; x: number; y: number; width?: number; height?: number; fontSize?: number; align?: "left" | "center" | "right" };

export type MedicalSourceMapping = Record<string, MedicalSourceFieldDescriptor>;

export type MedicalSourcePdfInspection = {
  sha256: string;
  pageCount: number;
  pageSizes: Array<{ width: number; height: number }>;
  fields: MedicalSourcePdfField[];
};

export function sha256Pdf(bytes: Uint8Array): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

export async function inspectMedicalSourcePdf(bytes: Uint8Array): Promise<MedicalSourcePdfInspection> {
  if (Buffer.from(bytes.subarray(0, 5)).toString("ascii") !== "%PDF-") {
    throw new Error("Source document is not a valid PDF");
  }
  const document = await PDFDocument.load(bytes, { ignoreEncryption: false });
  const form = document.getForm();
  const fields = form.getFields().map(field => {
    const name = field.getName();
    if (field instanceof PDFRadioGroup) return { name, type: "radio", options: field.getOptions() };
    if (field instanceof PDFDropdown) return { name, type: "dropdown", options: field.getOptions() };
    if (field instanceof PDFOptionList) return { name, type: "option_list", options: field.getOptions() };
    if (field instanceof PDFCheckBox) return { name, type: "checkbox" };
    if (field instanceof PDFTextField) return { name, type: "text" };
    return { name, type: field.constructor.name || "unknown" };
  });
  return {
    sha256: sha256Pdf(bytes),
    pageCount: document.getPageCount(),
    pageSizes: document.getPages().map(page => page.getSize()),
    fields,
  };
}

function descriptorFieldNames(descriptor: MedicalSourceFieldDescriptor): string[] {
  switch (descriptor.kind) {
    case "text": return [descriptor.field];
    case "checkbox": return [descriptor.field];
    case "checkbox_pair": return [descriptor.yesField, descriptor.noField, ...(descriptor.unsureField ? [descriptor.unsureField] : [])];
    case "radio": return [descriptor.field];
    case "overlay": return [];
  }
}

export async function validateMedicalSourceMapping(params: {
  bytes: Uint8Array;
  mapping: MedicalSourceMapping;
  allowedSourceKeys: Set<string>;
  strategy: "acroform" | "overlay";
}): Promise<{ inspection: MedicalSourcePdfInspection; mappedKeys: string[] }> {
  const inspection = await inspectMedicalSourcePdf(params.bytes);
  const fieldByName = new Map(inspection.fields.map(field => [field.name, field]));
  const pageSizes = inspection.pageSizes;

  for (const [sourceKey, descriptor] of Object.entries(params.mapping)) {
    if (!params.allowedSourceKeys.has(sourceKey)) {
      throw new Error(`Mapping references unknown source question key: ${sourceKey}`);
    }
    if (!descriptor || typeof descriptor !== "object" || !("kind" in descriptor)) {
      throw new Error(`Invalid mapping descriptor for ${sourceKey}`);
    }

    if (params.strategy === "acroform" && descriptor.kind === "overlay") {
      throw new Error(`AcroForm source ${sourceKey} cannot use an unverified overlay descriptor`);
    }

    for (const fieldName of descriptorFieldNames(descriptor)) {
      if (!fieldByName.has(fieldName)) {
        throw new Error(`PDF field does not exist: ${fieldName} (${sourceKey})`);
      }
    }

    if (descriptor.kind === "radio") {
      const field = fieldByName.get(descriptor.field);
      const options = field?.options ?? [];
      for (const option of [descriptor.yesValue, descriptor.noValue, ...(descriptor.unsureValue ? [descriptor.unsureValue] : [])]) {
        if (!options.includes(option)) {
          throw new Error(`Radio option ${JSON.stringify(option)} does not exist on ${descriptor.field}`);
        }
      }
    }

    if (descriptor.kind === "overlay") {
      if (params.strategy !== "overlay") {
        throw new Error(`Overlay mapping is not permitted for this source PDF`);
      }
      if (!Number.isInteger(descriptor.page) || descriptor.page < 0 || descriptor.page >= pageSizes.length) {
        throw new Error(`Overlay page is outside the source PDF: ${sourceKey}`);
      }
      const page = pageSizes[descriptor.page];
      const width = descriptor.width ?? 120;
      const height = descriptor.height ?? 14;
      if (![descriptor.x, descriptor.y, width, height].every(Number.isFinite)) {
        throw new Error(`Overlay coordinates must be finite numbers: ${sourceKey}`);
      }
      if (descriptor.x < 0 || descriptor.y < 0 || width <= 0 || height <= 0 || descriptor.x + width > page.width || descriptor.y + height > page.height) {
        throw new Error(`Overlay coordinates fall outside page ${descriptor.page + 1}: ${sourceKey}`);
      }
    }
  }

  return { inspection, mappedKeys: Object.keys(params.mapping) };
}

function normalizeAnswer(value: string | undefined): string {
  return (value ?? "").trim();
}

function lower(value: string | undefined): string {
  return normalizeAnswer(value).toLowerCase();
}

function setCheckbox(field: PDFCheckBox, checked: boolean) {
  if (checked) field.check();
  else field.uncheck();
}

function setTextField(field: PDFTextField, value: string) {
  field.setText(value);
}

export async function renderMappedMedicalSourcePdf(params: {
  bytes: Uint8Array;
  mapping: MedicalSourceMapping;
  answersBySourceKey: Map<string, string>;
  flatten?: boolean;
}): Promise<Uint8Array> {
  const document = await PDFDocument.load(params.bytes, { ignoreEncryption: false });
  const form = document.getForm();
  const pages = document.getPages();
  const overlayFont = await document.embedFont(StandardFonts.Helvetica);

  for (const [sourceKey, descriptor] of Object.entries(params.mapping)) {
    const answer = normalizeAnswer(params.answersBySourceKey.get(sourceKey));
    const normalized = lower(answer);

    switch (descriptor.kind) {
      case "text": {
        const field = form.getTextField(descriptor.field);
        setTextField(field, answer);
        break;
      }
      case "checkbox": {
        const field = form.getCheckBox(descriptor.field);
        const checked = descriptor.checkedWhen.map(value => value.toLowerCase()).includes(normalized);
        setCheckbox(field, checked);
        break;
      }
      case "checkbox_pair": {
        setCheckbox(form.getCheckBox(descriptor.yesField), normalized === "yes");
        setCheckbox(form.getCheckBox(descriptor.noField), normalized === "no");
        if (descriptor.unsureField) {
          setCheckbox(form.getCheckBox(descriptor.unsureField), normalized === "unsure" || normalized === "don't know" || normalized === "dont know");
        }
        break;
      }
      case "radio": {
        const field = form.getRadioGroup(descriptor.field);
        if (normalized === "yes") field.select(descriptor.yesValue);
        else if (normalized === "no") field.select(descriptor.noValue);
        else if (descriptor.unsureValue && (normalized === "unsure" || normalized === "don't know" || normalized === "dont know")) field.select(descriptor.unsureValue);
        break;
      }
      case "overlay": {
        if (!answer) break;
        const page = pages[descriptor.page];
        const fontSize = descriptor.fontSize ?? 9;
        const width = descriptor.width ?? 120;
        let x = descriptor.x;
        if (descriptor.align && descriptor.align !== "left") {
          const textWidth = overlayFont.widthOfTextAtSize(answer, fontSize);
          if (descriptor.align === "center") x += Math.max(0, (width - textWidth) / 2);
          if (descriptor.align === "right") x += Math.max(0, width - textWidth);
        }
        page.drawText(answer, {
          x,
          y: descriptor.y,
          size: fontSize,
          font: overlayFont,
          color: rgb(0, 0, 0),
          maxWidth: width,
        });
        break;
      }
    }
  }

  if (params.flatten && form.getFields().length > 0) form.flatten();
  return document.save({ useObjectStreams: false });
}

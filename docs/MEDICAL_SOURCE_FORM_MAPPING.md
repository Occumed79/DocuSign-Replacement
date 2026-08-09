# Verified Official Medical Source Form Workflow

PacketPath must never call a reconstructed response summary the official form. An **Official Form PDF** is enabled only when all of the following are true:

1. The exact source PDF revision is registered by SHA-256 and page count.
2. An administrator uploads a PDF whose bytes match that exact fingerprint.
3. Built-in questionnaire questions have stable `sourceKey` identities.
4. A `sourceKey -> PDF` mapping is validated against the uploaded PDF.
5. The mapping validation timestamp is current for the registered mapping version.

The source PDFs themselves are **not committed to this public repository**. Only fingerprints, mapping code/JSON, and verified coordinates or AcroForm field names belong in source control.

## Mapping strategies

### AcroForm

Use this when the supplied PDF already contains form fields. PacketPath reads the actual AcroForm field list from the exact uploaded PDF and permits only field names/options that exist.

Supported descriptors:

```json
{
  "q.example": { "kind": "text", "field": "Exact PDF field name" },
  "q.yesno": {
    "kind": "checkbox_pair",
    "yesField": "Exact Yes field",
    "noField": "Exact No field"
  },
  "q.radio": {
    "kind": "radio",
    "field": "Exact Radio field",
    "yesValue": "Yes",
    "noValue": "No"
  }
}
```

If a named field or radio export value does not exist, validation fails. There is no fuzzy matching.

### Overlay

Use this only for a source PDF without usable AcroForm fields. Coordinates must be measured and verified against the exact fingerprinted source revision.

```json
{
  "q.example": {
    "kind": "overlay",
    "page": 1,
    "x": 414.2,
    "y": 536.7,
    "width": 46,
    "height": 12,
    "fontSize": 8
  }
}
```

`page` is zero-based. Validation rejects pages or rectangles outside the exact source page bounds. A new PDF revision/fingerprint requires a new verified coordinate map.

## Adaptive follow-up responses

Source-form mappings target **root/source questions only**. Adaptive follow-up questions do not overwrite or replace official source questions and are not forced into unrelated source-form boxes.

When follow-up responses exist, PacketPath appends clearly titled **Additional Medical History Details** pages after the original source pages. Each detail remains attached to the original source question that triggered it.

## API workflow

Admin endpoints:

- `GET /api/medical-source-forms/registry`
- `POST /api/medical-source-forms/:examTypeId/upload`
- `GET /api/medical-source-forms/:examTypeId/fields`
- `PUT /api/medical-source-forms/:sourceId/mapping`
- `DELETE /api/medical-source-forms/:sourceId`

Case endpoints:

- `GET /api/cases/:id/official-source-form/status`
- `GET /api/cases/:id/official-source-form.pdf`

The PDF endpoint returns `422` rather than silently substituting another document when the exact source or validated map is unavailable.

## Supplied source inventory

The source registry currently fingerprints 12 supplied families: DD 2807-1, DD 2795, DS-1843, DS-6570, DS-6561, NSF Polar/Form 1700, POST 2-252 Peace Officer, POST 2-264 Public Safety Dispatcher, Occu-Med Gold, Occu-Med Sedentary, Occu-Med 2014 Core, and ABS North America.

The supplied DS-1843, DS-6561, POST 2-252, POST 2-264, and Occu-Med Sedentary PDFs contain usable AcroForm fields. The remaining supplied PDFs require verified overlay mappings.

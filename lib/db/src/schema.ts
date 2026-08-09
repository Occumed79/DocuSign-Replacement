// Package-level schema shim. `lib/db/src/index.ts` imports/exports `./schema`, so
// this file keeps every existing directory export while adding the verified
// medical-source-form table without changing any legacy schema module path.
export * from "./schema/index";
export * from "./schema/medical-source-forms";

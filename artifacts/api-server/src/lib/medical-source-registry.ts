export type MedicalSourceMapStrategy = "acroform" | "overlay";

export interface MedicalSourceRegistryEntry {
  sourceFamily: string;
  name: string;
  sha256: string;
  pageCount: number;
  strategy: MedicalSourceMapStrategy;
  mappingVersion: number;
}

/**
 * Fingerprints were calculated from the exact source files supplied for the
 * built-in medical questionnaire library. The files themselves are deliberately
 * NOT committed to this public repository.
 *
 * Upload validation is exact: a different/revised PDF must be registered and
 * mapped as a new source version instead of silently inheriting coordinates or
 * AcroForm field names from another revision.
 */
export const MEDICAL_SOURCE_REGISTRY: readonly MedicalSourceRegistryEntry[] = [
  {
    sourceFamily: "dd2807-1",
    name: "DD Form 2807-1 Report of Medical History",
    sha256: "93d2d876c69fd8a423b3967d8eef3e50822ae472f3ca0e133c1703bcb8ba8a93",
    pageCount: 5,
    strategy: "overlay",
    mappingVersion: 1,
  },
  {
    sourceFamily: "dd2795",
    name: "DD Form 2795 Pre-Deployment Health Assessment",
    sha256: "6cceeaf5da6738174144708b71664cf0fe0ca3e2409e8aa6ca5fd6d8d571ec1c",
    pageCount: 2,
    strategy: "overlay",
    mappingVersion: 1,
  },
  {
    sourceFamily: "ds1843",
    name: "DS-1843 Medical History and Examination",
    sha256: "c2d0bbe617abe7d2a4e9a7db760005caf3225160e93c00ee4cb18ce9e921b2d7",
    pageCount: 4,
    strategy: "acroform",
    mappingVersion: 1,
  },
  {
    sourceFamily: "ds6570",
    name: "DS-6570 Employee Self-Certification and Ability to Perform in ESCAPE Posts",
    sha256: "bab04d866b8962ac883f65fbc7a518b3e818ed531055665256c1692031922637",
    pageCount: 2,
    strategy: "overlay",
    mappingVersion: 1,
  },
  {
    sourceFamily: "ds6561",
    name: "DS-6561 Non-Foreign Service Personnel and Family Members",
    sha256: "61c4135db83667e95363c6886d67779f6474f5042002d84bfdf7f431a7529113",
    pageCount: 2,
    strategy: "acroform",
    mappingVersion: 1,
  },
  {
    sourceFamily: "polar-1700",
    name: "NSF Polar Medical History / Form 1700",
    sha256: "8ef19e81fd4049332bbccbebc4b52ea19b07c76ef063bcddd55123885108c383",
    pageCount: 7,
    strategy: "overlay",
    mappingVersion: 1,
  },
  {
    sourceFamily: "post-2-252-peace-officer",
    name: "POST 2-252 Medical History Statement — Peace Officer",
    sha256: "037dbc91504d620f7eeceb672bf71860b7b7abfef236dfd9bca72164ba0d787e",
    pageCount: 6,
    strategy: "acroform",
    mappingVersion: 1,
  },
  {
    sourceFamily: "post-2-264-dispatcher",
    name: "POST 2-264 Medical History Statement — Public Safety Dispatcher",
    sha256: "9eb8d8868ff7f8f2e3b2ddd6db71ea5818433bbb65d9a0f633694d884f23a312",
    pageCount: 6,
    strategy: "acroform",
    mappingVersion: 1,
  },
  {
    sourceFamily: "occumed-gold",
    name: "Occu-Med Medical History Questionnaire — Gold",
    sha256: "888b0cb7b8c1ca3cc4df304cd2348a80af840a696d97d7c17be6c7340afc53be",
    pageCount: 9,
    strategy: "overlay",
    mappingVersion: 1,
  },
  {
    sourceFamily: "occumed-sedentary",
    name: "Occu-Med Sedentary Medical History Questionnaire",
    sha256: "5b73314cf66349708b878b238643700135bac409712dde20737dcb9b5ae0efcf",
    pageCount: 2,
    strategy: "acroform",
    mappingVersion: 1,
  },
  {
    sourceFamily: "occumed-core-2014",
    name: "Occu-Med Medical History Questionnaire — 2014 Core",
    sha256: "d9ad2aaf77a0fbb2949e0d8e4b5f938558becdea4063c733d0a4a6c8854ebd7c",
    pageCount: 10,
    strategy: "overlay",
    mappingVersion: 1,
  },
  {
    sourceFamily: "abs-north-america",
    name: "American Bureau of Shipping — North America Medical History Questionnaire",
    sha256: "9101cb3a9e640eb3a0e935943b5184f170ad2a4ba314c90b91f4afe4fd670ae3",
    pageCount: 5,
    strategy: "overlay",
    mappingVersion: 1,
  },
] as const;

export function getMedicalSourceRegistryEntry(sourceFamily: string): MedicalSourceRegistryEntry | undefined {
  return MEDICAL_SOURCE_REGISTRY.find(entry => entry.sourceFamily === sourceFamily);
}

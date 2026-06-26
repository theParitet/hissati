/**
 * Hissati — program knowledge base loader (FR-B1/FR-B4).
 *
 * The KB ships bundled inside the client (imported JSON → inlined into the JS
 * chunk), so matching works fully offline with no runtime fetch (NFR-1/FR-C4).
 * It is validated against the Zod contract AT MODULE LOAD: if the dataset ever
 * drifts from `ProgramSchema`, this throws loudly in tests and at build instead
 * of silently shipping a malformed program.
 */
import rawFile from "@/data/programs.json";
import { ProgramFileSchema, type Program } from "@/lib/schema";

const parsed = ProgramFileSchema.parse(rawFile);

export const PROGRAMS: Program[] = parsed.programs;
export const PROGRAMS_GENERATED: string = parsed.generated;

export function getProgramById(id: string): Program | undefined {
  return PROGRAMS.find((p) => p.id === id);
}

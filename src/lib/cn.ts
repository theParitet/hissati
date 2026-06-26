/** Tiny classnames joiner — no dep; falsy parts dropped. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

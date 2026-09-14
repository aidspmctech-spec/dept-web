/**
 * Normalizes fee names to Title Case.
 * Examples: "book fees" -> "Book Fees", "  Book   fees  " -> "Book Fees"
 */
export function normalizeFeeName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

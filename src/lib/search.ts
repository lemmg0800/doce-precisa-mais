/**
 * Normaliza string para busca: remove acentos, baixa caixa e espaços extras.
 */
export function normalizeSearch(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Verifica se `haystack` contém `needle` ignorando acentos e maiúsculas.
 */
export function matchesSearch(haystack: unknown, needle: unknown): boolean {
  const n = normalizeSearch(needle);
  if (!n) return true;
  return normalizeSearch(haystack).includes(n);
}

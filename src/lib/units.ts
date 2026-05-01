import type { Unidade } from "@/store/types";

export const UNIDADE_LABEL: Record<Unidade, string> = {
  g: "g",
  kg: "kg",
  ml: "ml",
  L: "L",
  unidade: "un",
};

export function unidadeLabel(u: Unidade | null | undefined): string {
  if (!u) return "";
  return UNIDADE_LABEL[u] ?? u;
}

/**
 * Retorna as unidades compatíveis (mesma família) com a unidade base.
 * - peso: g, kg
 * - volume: ml, L
 * - contagem: unidade
 */
export function unidadesCompativeis(base: Unidade): Unidade[] {
  switch (base) {
    case "g":
    case "kg":
      return ["g", "kg"];
    case "ml":
    case "L":
      return ["ml", "L"];
    case "unidade":
      return ["unidade"];
  }
}

/**
 * Retorna a unidade "pequena" (mais comum em receitas) para a família da unidade base.
 * peso → g, volume → ml, contagem → unidade.
 */
export function unidadePadraoReceita(base: Unidade): Unidade {
  switch (base) {
    case "g":
    case "kg":
      return "g";
    case "ml":
    case "L":
      return "ml";
    case "unidade":
      return "unidade";
  }
}

/**
 * Converte uma quantidade da unidade `de` para a unidade `para`.
 * Se as unidades forem incompatíveis, retorna a quantidade sem conversão.
 */
export function converterQuantidade(
  quantidade: number,
  de: Unidade,
  para: Unidade,
): number {
  if (de === para) return quantidade;

  // Peso
  if (de === "kg" && para === "g") return quantidade * 1000;
  if (de === "g" && para === "kg") return quantidade / 1000;

  // Volume
  if (de === "L" && para === "ml") return quantidade * 1000;
  if (de === "ml" && para === "L") return quantidade / 1000;

  // Incompatível: retorna como está
  return quantidade;
}

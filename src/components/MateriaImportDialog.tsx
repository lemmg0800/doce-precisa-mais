import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePricingStore } from "@/store/usePricingStore";
import type { Categoria, MateriaPrima, Unidade } from "@/store/types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

type DupStrategy = "atualizar" | "ignorar" | "duplicar";

interface RowParsed {
  linha: number;
  nome: string;
  valor_embalagem: number;
  quantidade_embalagem: number;
  unidade_medida: Unidade;
  categoria: Categoria;
}

interface RowError {
  linha: number;
  erro: string;
}

interface Result {
  importados: number;
  atualizados: number;
  ignorados: number;
  duplicados: number;
  erros: RowError[];
}

const UNIDADES_VALIDAS: Unidade[] = ["g", "kg", "ml", "L", "unidade"];
const CATEGORIAS_VALIDAS: Categoria[] = ["ingrediente", "embalagem"];
const COLUNAS_OBRIGATORIAS = [
  "nome",
  "valor_embalagem",
  "quantidade_embalagem",
  "unidade_medida",
  "categoria",
] as const;

async function downloadModelo() {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  // Aba de dados
  const dados = [
    ["nome", "valor_embalagem", "quantidade_embalagem", "unidade_medida", "categoria"],
    ["Chocolate meio amargo", 38.0, 1000, "g", "ingrediente"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(dados);
  ws["!cols"] = [
    { wch: 30 }, { wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "materias_primas");

  // Aba de instruções
  const inst = [
    ["INSTRUÇÕES PARA IMPORTAÇÃO"],
    [],
    ["Regras:"],
    ["• Não alterar os nomes das colunas"],
    ["• Usar ponto (.) para casas decimais. Ex: 38.50"],
    ["• unidade_medida deve ser exatamente: g, kg, ml, L ou unidade"],
    ["• categoria deve ser exatamente: ingrediente ou embalagem"],
    ["• Todos os valores numéricos devem ser maiores que zero"],
    [],
    ["Colunas obrigatórias:"],
    ["nome | valor_embalagem | quantidade_embalagem | unidade_medida | categoria"],
    [],
    ["Exemplo:"],
    ["Chocolate meio amargo | 38.00 | 1000 | g | ingrediente"],
  ];
  const wsInst = XLSX.utils.aoa_to_sheet(inst);
  wsInst["!cols"] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInst, "instruções");

  XLSX.writeFile(wb, "modelo-materias-primas.xlsx");
}

function normalize(s: string): string {
  return String(s ?? "").trim().toLowerCase();
}

function parseUnidade(v: unknown): Unidade | null {
  const s = String(v ?? "").trim();
  // case-sensitive para L e kg etc, mas tolerante
  if (UNIDADES_VALIDAS.includes(s as Unidade)) return s as Unidade;
  const lower = s.toLowerCase();
  if (lower === "l") return "L";
  if (lower === "kg") return "kg";
  if (lower === "g") return "g";
  if (lower === "ml") return "ml";
  if (lower === "un" || lower === "unidade" || lower === "und") return "unidade";
  return null;
}

function parseCategoria(v: unknown): Categoria | null {
  const s = normalize(String(v));
  if (s === "ingrediente") return "ingrediente";
  if (s === "embalagem") return "embalagem";
  return null;
}

function parseNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v ?? "").trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function MateriaImportDialog({ open, onOpenChange }: Props) {
  const materias = usePricingStore((s) => s.materias);
  const loadAll = usePricingStore((s) => s.loadAll);

  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedRows, setParsedRows] = useState<RowParsed[]>([]);
  const [errors, setErrors] = useState<RowError[]>([]);
  const [duplicates, setDuplicates] = useState<RowParsed[]>([]);
  const [strategy, setStrategy] = useState<DupStrategy>("atualizar");
  const [askingStrategy, setAskingStrategy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const reset = () => {
    setParsedRows([]);
    setErrors([]);
    setDuplicates([]);
    setResult(null);
    setFileName("");
    setAskingStrategy(false);
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const handleFile = async (file: File) => {
    reset();
    setFileName(file.name);
    setParsing(true);
    try {
      const buf = await file.arrayBuffer();
      const XLSX = await import("xlsx");
      const wb = XLSX.read(buf, { type: "array" });
      // pega primeira aba (ou a chamada materias_primas se existir)
      const sheetName =
        wb.SheetNames.find((n) => normalize(n).includes("materia")) ??
        wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
        defval: "",
        raw: true,
      });

      if (rows.length === 0) {
        toast.error("Planilha vazia.");
        setParsing(false);
        return;
      }

      // Verificar colunas
      const cabec = Object.keys(rows[0]).map(normalize);
      const faltando = COLUNAS_OBRIGATORIAS.filter(
        (c) => !cabec.includes(c),
      );
      if (faltando.length > 0) {
        toast.error(`Colunas faltando: ${faltando.join(", ")}`);
        setParsing(false);
        return;
      }

      // Mapeia chaves originais -> normalizadas
      const keyMap = new Map<string, string>();
      Object.keys(rows[0]).forEach((k) => keyMap.set(normalize(k), k));

      const parsed: RowParsed[] = [];
      const errs: RowError[] = [];
      const dup: RowParsed[] = [];
      const nomesExistentes = new Set(
        materias.map((m) => m.nome.trim().toLowerCase()),
      );

      rows.forEach((row, idx) => {
        const linha = idx + 2; // linha 1 é o cabeçalho
        const get = (k: string) => row[keyMap.get(k) ?? k];

        const nome = String(get("nome") ?? "").trim();
        const valor = parseNumber(get("valor_embalagem"));
        const qtd = parseNumber(get("quantidade_embalagem"));
        const unidade = parseUnidade(get("unidade_medida"));
        const categoria = parseCategoria(get("categoria"));

        if (!nome) {
          errs.push({ linha, erro: "Nome vazio." });
          return;
        }
        if (valor === null || valor <= 0) {
          errs.push({ linha, erro: "valor_embalagem deve ser maior que zero." });
          return;
        }
        if (qtd === null || qtd <= 0) {
          errs.push({ linha, erro: "quantidade_embalagem deve ser maior que zero." });
          return;
        }
        if (!unidade) {
          errs.push({
            linha,
            erro: `unidade_medida inválida (use: ${UNIDADES_VALIDAS.join(", ")}).`,
          });
          return;
        }
        if (!categoria) {
          errs.push({
            linha,
            erro: "categoria inválida (use: ingrediente ou embalagem).",
          });
          return;
        }

        const item: RowParsed = {
          linha,
          nome,
          valor_embalagem: valor,
          quantidade_embalagem: qtd,
          unidade_medida: unidade,
          categoria,
        };
        if (nomesExistentes.has(nome.toLowerCase())) dup.push(item);
        parsed.push(item);
      });

      setParsedRows(parsed);
      setErrors(errs);
      setDuplicates(dup);

      if (parsed.length === 0) {
        toast.error("Nenhuma linha válida para importar.");
      } else if (dup.length > 0) {
        setAskingStrategy(true);
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Erro ao ler o arquivo.",
      );
    } finally {
      setParsing(false);
    }
  };

  const executarImportacao = async () => {
    setAskingStrategy(false);
    setImporting(true);
    const res: Result = {
      importados: 0,
      atualizados: 0,
      ignorados: 0,
      duplicados: 0,
      erros: [...errors],
    };

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData.user?.id;
      if (!user_id) {
        toast.error("Você precisa estar autenticado.");
        setImporting(false);
        return;
      }

      const existentesPorNome = new Map<string, MateriaPrima>();
      materias.forEach((m) =>
        existentesPorNome.set(m.nome.trim().toLowerCase(), m),
      );

      const inserts: Array<Omit<MateriaPrima, "id"> & { user_id: string }> = [];

      for (const row of parsedRows) {
        const chave = row.nome.toLowerCase();
        const existente = existentesPorNome.get(chave);
        const payload = {
          nome: row.nome,
          valor_embalagem: row.valor_embalagem,
          quantidade_embalagem: row.quantidade_embalagem,
          unidade_medida: row.unidade_medida,
          categoria: row.categoria,
        };

        if (existente) {
          if (strategy === "ignorar") {
            res.ignorados++;
            continue;
          }
          if (strategy === "atualizar") {
            const { error } = await supabase
              .from("materias_primas")
              .update(payload)
              .eq("id", existente.id);
            if (error) {
              res.erros.push({ linha: row.linha, erro: error.message });
            } else {
              res.atualizados++;
            }
            continue;
          }
          // duplicar -> insere mesmo assim
          res.duplicados++;
        }
        inserts.push({ ...payload, user_id });
      }

      if (inserts.length > 0) {
        const { error } = await supabase
          .from("materias_primas")
          .insert(inserts);
        if (error) {
          res.erros.push({ linha: 0, erro: error.message });
        } else {
          res.importados += inserts.length;
        }
      }

      await loadAll();
      setResult(res);
      if (res.erros.length === 0) {
        toast.success(
          `Importação concluída: ${res.importados + res.atualizados + res.duplicados} ite${
            res.importados + res.atualizados + res.duplicados === 1 ? "m" : "ns"
          }.`,
        );
      } else {
        toast.warning(
          `Importação concluída com ${res.erros.length} erro(s).`,
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao importar.");
    } finally {
      setImporting(false);
    }
  };

  const totalValidas = parsedRows.length;
  const aImportar =
    strategy === "ignorar"
      ? totalValidas - duplicates.length
      : totalValidas;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              Importar matérias-primas
            </DialogTitle>
            <DialogDescription>
              Envie uma planilha .xlsx ou .csv. Baixe o modelo para garantir o
              formato correto.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <Button
              variant="outline"
              onClick={downloadModelo}
              className="justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar modelo de planilha
            </Button>

            <div className="grid gap-2">
              <Label htmlFor="file">Arquivo (.xlsx ou .csv)</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls,.csv"
                disabled={parsing || importing}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              {fileName && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileSpreadsheet className="h-3 w-3" />
                  {fileName}
                </p>
              )}
            </div>

            {(parsedRows.length > 0 || errors.length > 0) && !result && (
              <div className="rounded-lg border p-3 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Linhas válidas</span>
                  <span className="font-semibold">{parsedRows.length}</span>
                </div>
                {duplicates.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duplicadas</span>
                    <span className="font-semibold">{duplicates.length}</span>
                  </div>
                )}
                {errors.length > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Erros</span>
                    <span className="font-semibold">{errors.length}</span>
                  </div>
                )}
              </div>
            )}

            {errors.length > 0 && !result && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm max-h-40 overflow-auto">
                <div className="flex items-center gap-2 font-medium text-destructive mb-2">
                  <AlertCircle className="h-4 w-4" />
                  Erros encontrados
                </div>
                <ul className="space-y-1 text-xs">
                  {errors.slice(0, 50).map((e, i) => (
                    <li key={i}>
                      <span className="font-medium">Linha {e.linha}:</span>{" "}
                      {e.erro}
                    </li>
                  ))}
                  {errors.length > 50 && (
                    <li className="text-muted-foreground">
                      ...e mais {errors.length - 50}
                    </li>
                  )}
                </ul>
              </div>
            )}

            {result && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Resultado
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Importados: <b>{result.importados}</b></div>
                  <div>Atualizados: <b>{result.atualizados}</b></div>
                  <div>Ignorados: <b>{result.ignorados}</b></div>
                  <div>Duplicados: <b>{result.duplicados}</b></div>
                  <div className="col-span-2 text-destructive">
                    Erros: <b>{result.erros.length}</b>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleClose(false)}>
              {result ? "Fechar" : "Cancelar"}
            </Button>
            {!result && (
              <Button
                disabled={
                  parsing ||
                  importing ||
                  parsedRows.length === 0 ||
                  askingStrategy
                }
                onClick={executarImportacao}
              >
                <Upload className="h-4 w-4 mr-2" />
                {importing
                  ? "Importando..."
                  : `Importar ${aImportar} ite${aImportar === 1 ? "m" : "ns"}`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={askingStrategy} onOpenChange={setAskingStrategy}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {duplicates.length} matéria(s)-prima(s) já existem
            </AlertDialogTitle>
            <AlertDialogDescription>
              Algumas linhas da planilha têm o mesmo nome de itens já
              cadastrados. O que você quer fazer?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <RadioGroup
            value={strategy}
            onValueChange={(v) => setStrategy(v as DupStrategy)}
            className="gap-3 py-2"
          >
            <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent">
              <RadioGroupItem value="atualizar" id="r-upd" className="mt-0.5" />
              <div className="grid gap-0.5">
                <span className="font-medium text-sm">Atualizar existentes</span>
                <span className="text-xs text-muted-foreground">
                  Substitui os dados das matérias-primas com nome igual.
                </span>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent">
              <RadioGroupItem value="ignorar" id="r-ign" className="mt-0.5" />
              <div className="grid gap-0.5">
                <span className="font-medium text-sm">Ignorar duplicados</span>
                <span className="text-xs text-muted-foreground">
                  Não importa as linhas que já existem.
                </span>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent">
              <RadioGroupItem value="duplicar" id="r-dup" className="mt-0.5" />
              <div className="grid gap-0.5">
                <span className="font-medium text-sm">Criar duplicados</span>
                <span className="text-xs text-muted-foreground">
                  Cria registros novos mesmo com nome repetido.
                </span>
              </div>
            </label>
          </RadioGroup>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => setAskingStrategy(false)}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

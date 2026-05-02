import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  min?: number;
  disabled?: boolean;
}

/** Currency input in BRL with raw number state. */
export function CurrencyInput({ value, onChange, placeholder = "0,00", className, id, min, disabled }: Props) {
  const [text, setText] = useState(() =>
    value ? value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "",
  );

  return (
    <div className={cn("relative", className)}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
        R$
      </span>
      <Input
        id={id}
        inputMode="decimal"
        className="pl-9 text-right tabular-nums"
        disabled={disabled}
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d,.-]/g, "");
          setText(raw);
          const norm = raw.replace(/\./g, "").replace(",", ".");
          const n = parseFloat(norm);
          onChange(Number.isFinite(n) ? n : 0);
        }}
        onBlur={() => {
          const v = value || 0;
          if (min != null && v < min) onChange(min);
          setText(
            v
              ? v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : "",
          );
        }}
      />
    </div>
  );
}

export function NumberInput({
  value,
  onChange,
  placeholder,
  className,
  id,
  suffix,
  min,
  step = "any",
  autoFocus,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  suffix?: string;
  min?: number;
  step?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        disabled={disabled}
        autoFocus={autoFocus}
        className={cn("text-right tabular-nums", suffix && "pr-10")}
        value={Number.isFinite(value) && value !== 0 ? value : value === 0 ? 0 : ""}
        placeholder={placeholder}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => {
          const n = parseFloat(e.target.value.replace(",", "."));
          onChange(Number.isFinite(n) ? n : 0);
        }}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Renders a single-line truncated title. When the text overflows
 * (i.e., gets the "..."), hovering shows a small tooltip with the full name.
 */
export function TruncatedTitle({
  text,
  className,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3" | "div";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflow(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  const node = (
    <Tag
      ref={ref as React.RefObject<HTMLElement> & React.RefObject<HTMLHeadingElement>}
      className={cn("block truncate", className)}
    >
      {text}
    </Tag>
  );

  if (!overflow) return node;

  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>{node}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

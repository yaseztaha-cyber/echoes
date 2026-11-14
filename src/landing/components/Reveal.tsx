import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { observeReveal } from "../lib/hooks";

type Props = {
  as?: ElementType;
  delay?: number;
  className?: string;
  children: ReactNode;
};

/** Scroll-triggered reveal. Content stays in the DOM and is visible with reduced motion. */
export function Reveal({ as = "div", delay = 0, className = "", children }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return observeReveal(el);
  }, []);
  const Comp = as as any;
  return (
    <Comp ref={ref} className={`reveal ${className}`} style={{ "--d": `${delay}ms` } as React.CSSProperties}>
      {children}
    </Comp>
  );
}

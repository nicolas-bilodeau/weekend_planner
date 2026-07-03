import type { CSSProperties } from "react";
import type { EventCategory } from "@/lib/types";

const CATEGORY_COLOR_VAR: Record<EventCategory, string> = {
  obligation: "var(--color-cat-obligation)",
  prevu: "var(--color-cat-prevu)",
  envie: "var(--color-cat-envie)",
};

/** Renders the square/circle/triangle glyph used to mark each event category. */
export function CategoryDot({
  category,
  size = 9,
  className,
}: {
  category: EventCategory;
  size?: number;
  className?: string;
}) {
  const color = CATEGORY_COLOR_VAR[category];
  const base: CSSProperties = { width: size, height: size, flex: "0 0 auto", display: "inline-block", background: color };

  const style: CSSProperties =
    category === "prevu"
      ? { ...base, borderRadius: "50%" }
      : category === "envie"
        ? { ...base, clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }
        : base;

  return <span className={className} style={style} aria-hidden="true" />;
}

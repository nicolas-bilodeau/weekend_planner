import type { CSSProperties } from "react";
import type { WeekendStatus } from "@/lib/types";

const SHAPE_CLIP: Record<WeekendStatus, string | undefined> = {
  libre: undefined,
  protege: "polygon(50% 0, 100% 24%, 84% 100%, 16% 100%, 0 24%)",
  partiel: "polygon(50% 6%, 100% 100%, 0 100%)",
  occupe: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)",
};

const ICON_COLOR_VAR: Record<WeekendStatus, string> = {
  libre: "var(--color-status-libre-icon)",
  protege: "var(--color-status-protege-icon)",
  partiel: "var(--color-status-partiel-icon)",
  occupe: "var(--color-status-occupe-icon)",
};

/** Renders the ring/shield/triangle/diamond glyph used to mark each weekend status. */
export function StatusIcon({
  status,
  size = 11,
  color,
  className,
}: {
  status: WeekendStatus;
  size?: number;
  color?: string;
  className?: string;
}) {
  const iconColor = color ?? ICON_COLOR_VAR[status];
  const clip = SHAPE_CLIP[status];

  const style: CSSProperties =
    status === "libre"
      ? {
          width: size,
          height: size,
          borderRadius: "50%",
          border: `2px solid ${iconColor}`,
          boxSizing: "border-box",
          background: "transparent",
          flex: "0 0 auto",
          display: "inline-block",
        }
      : {
          width: size,
          height: size,
          background: iconColor,
          clipPath: clip,
          flex: "0 0 auto",
          display: "inline-block",
        };

  return <span className={className} style={style} aria-hidden="true" />;
}

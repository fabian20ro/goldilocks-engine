import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { DecorativeGlyph, type Glyph } from "./glyphs";

export function DetailsSurface({
  title,
  glyph,
  onClose,
  returnFocus,
  children,
}: {
  title: string;
  glyph: Glyph;
  onClose: () => void;
  returnFocus?: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const originRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (document.activeElement instanceof HTMLElement)
      originRef.current = document.activeElement;
  }, []);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
      requestAnimationFrame(() =>
        (returnFocus?.current ?? originRef.current)?.focus(),
      );
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [onClose, returnFocus]);
  return (
    <section className="details-surface" aria-label={`${title} details`}>
      <div className="details-heading">
        <strong>
          <DecorativeGlyph>{glyph}</DecorativeGlyph> {title}
        </strong>
        <button
          ref={closeRef}
          type="button"
          onClick={() => {
            onClose();
            requestAnimationFrame(() =>
              (returnFocus?.current ?? originRef.current)?.focus(),
            );
          }}
          aria-label={`Close ${title} details`}
        >
          Close
        </button>
      </div>
      <div className="details-body">{children}</div>
    </section>
  );
}

export function StatusGauge({
  label,
  value,
  display,
  tone = "signal",
}: {
  label: string;
  value: number;
  display: string;
  tone?: "signal" | "warning" | "failure" | "evidence";
}) {
  const bounded = Math.max(0, Math.min(100, value));
  return (
    <div className={`status-gauge ${tone}`}>
      <span>
        {label} <strong>{display}</strong>
      </span>
      <div
        className="gauge-track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(bounded)}
      >
        <span style={{ width: `${bounded}%` }} />
      </div>
    </div>
  );
}

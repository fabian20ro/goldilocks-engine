import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
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
  useLayoutEffect(() => {
    if (document.activeElement instanceof HTMLElement)
      originRef.current = document.activeElement;
  }, [title]);
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

export function ItemDetailsDisclosure({
  summary,
  title,
  open,
  onOpen,
  onClose,
  children,
}: {
  summary: string;
  title: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const summaryRef = useRef<HTMLElement>(null);
  const closeAndRestore = useCallback(() => {
    onClose();
    requestAnimationFrame(() => summaryRef.current?.focus());
  }, [onClose]);

  useLayoutEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeAndRestore();
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [closeAndRestore, open]);

  return (
    <details
      className="upgrade-details"
      open={open}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        closeAndRestore();
      }}
      onToggle={(event) => {
        if (event.currentTarget.open && !open) onOpen();
        if (!event.currentTarget.open && open) onClose();
      }}
    >
      <summary
        ref={summaryRef}
        onClick={(event) => {
          event.preventDefault();
          if (open) onClose();
          else onOpen();
        }}
      >
        {summary}
      </summary>
      <div className="upgrade-details-body" aria-label={`${title} details`}>
        {children}
        <button
          type="button"
          className="details-close"
          aria-label={`Close ${title} details`}
          onClick={closeAndRestore}
        >
          Close details
        </button>
      </div>
    </details>
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

/** Compact signed comparison used by the existing inspection and upgrade views. */
export function ComparisonDelta({
  label,
  current,
  baseline,
  suffix = "",
  inverse = false,
  digits = 2,
}: {
  label: string;
  current: number;
  baseline?: number;
  suffix?: string;
  inverse?: boolean;
  digits?: number;
}) {
  if (baseline === undefined)
    return (
      <span className="delta neutral" aria-label={`${label}: no comparison`}>
        —
      </span>
    );
  const difference = current - baseline;
  const good = inverse ? difference < 0 : difference > 0;
  const display = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(difference);
  return (
    <span
      className={`delta ${Math.abs(difference) < 0.005 ? "neutral" : good ? "good" : "bad"}`}
      aria-label={`${label}: ${difference > 0 ? "plus " : ""}${display}${suffix}`}
    >
      {difference > 0 ? "+" : ""}
      {display}
      {suffix}
    </span>
  );
}

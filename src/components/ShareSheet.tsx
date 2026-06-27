"use client";

/**
 * ShareSheet — shared share controls: WhatsApp, copy, and an offline QR to the
 * live app. Consumed by the dashboard (plan-level) and the checklist (per-program).
 * The QR is generated in-browser (no runtime CDN) and the live URL is resolved
 * lazily on open, so there's no SSR/hydration mismatch when NEXT_PUBLIC_APP_URL
 * is unset. The prop shape is the frozen contract.
 */
import { useMemo, useState } from "react";
import { Share2, Copy, Check, QrCode } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ui, type Locale } from "@/lib/i18n";
import { waHref, appUrl, qrSvgPath, type SharePayload } from "@/lib/share";

export function ShareSheet({
  payload,
  locale,
  className,
}: {
  payload: SharePayload;
  locale: Locale;
  className?: string;
}) {
  const t = ui(locale);
  const isAr = locale === "ar";
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  // Resolved only after the user opens the QR → client-only, avoids hydration drift.
  const [link, setLink] = useState<string | null>(null);

  const copy = async () => {
    const text = [payload.body, payload.url].filter(Boolean).join(" ");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — WhatsApp link still works */
    }
  };

  const toggleQr = () => {
    setQrOpen((open) => {
      if (!open && !link) setLink(appUrl());
      return !open;
    });
  };

  const qr = useMemo(() => (link ? qrSvgPath(link) : null), [link]);

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <a href={waHref(payload)} target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4" aria-hidden /> {t.shareWhatsapp}
          </Button>
        </a>
        <Button variant="ghost" size="sm" onClick={copy} aria-live="polite">
          {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          {copied ? t.copied : t.copyLink}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleQr}
          aria-expanded={qrOpen}
          aria-controls="sharesheet-qr"
        >
          <QrCode className="h-4 w-4" aria-hidden /> {isAr ? "رمز QR" : "QR code"}
        </Button>
      </div>

      {qrOpen && qr ? (
        <div
          id="sharesheet-qr"
          className="flex w-max max-w-full items-center gap-3 rounded-card border border-sand-line bg-sand-100 p-3 shadow-card"
        >
          <svg
            viewBox={`0 0 ${qr.size} ${qr.size}`}
            width={116}
            height={116}
            shapeRendering="crispEdges"
            role="img"
            aria-label={isAr ? "رمز الاستجابة السريعة لفتح حِصّتي" : "QR code to open Hissati"}
            className="shrink-0 rounded-md"
          >
            <rect width={qr.size} height={qr.size} fill="#ffffff" />
            <path d={qr.path} fill="#21180f" />
          </svg>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-ink">
              {isAr ? "امسح لفتح حِصّتي" : "Scan to open Hissati"}
            </div>
            <p className="mt-1 max-w-[12rem] text-xs text-ink-soft">
              {isAr
                ? "افتح الرابط على هاتفك وتابع خطتك."
                : "Open it on your phone and keep your plan with you."}
            </p>
            <div dir="ltr" className="mt-1.5 truncate font-mono text-[11px] text-ink-faint">
              {link}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

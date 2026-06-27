"use client";

/**
 * ShareSheet — shared share controls (WhatsApp + copy). Consumed by the dashboard
 * (plan-level) and the checklist (per-program). L5 may enrich (QR to live URL);
 * the prop shape is the frozen contract.
 */
import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ui, type Locale } from "@/lib/i18n";
import { waHref, type SharePayload } from "@/lib/share";

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
  const [copied, setCopied] = useState(false);

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

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <a href={waHref(payload)} target="_blank" rel="noreferrer">
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4" aria-hidden /> {t.shareWhatsapp}
        </Button>
      </a>
      <Button variant="ghost" size="sm" onClick={copy} aria-live="polite">
        {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        {copied ? t.copied : t.copyLink}
      </Button>
    </div>
  );
}

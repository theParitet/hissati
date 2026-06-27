import { FileDown } from "lucide-react";
import { Button } from "@/components/ui";
import { ui, type Locale } from "@/lib/i18n";

/** One visual contract for every plan-PDF download action. */
export function DownloadPdfButton({
  locale,
  onClick,
  className,
}: {
  locale: Locale;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button size="sm" variant="outline" className={className} onClick={onClick}>
      <FileDown className="h-4 w-4" aria-hidden />
      {ui(locale).downloadPdf}
    </Button>
  );
}


import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION } from "@/lib/site";

// PWA manifest (Next built-in). Installable + offline app shell (NFR-1).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hissati — funding-readiness navigator",
    short_name: "Hissati",
    description: SITE_DESCRIPTION,
    lang: "ar",
    dir: "rtl",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f1e7",
    theme_color: "#14584a",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}

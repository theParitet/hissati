import type { MetadataRoute } from "next";

// PWA manifest (Next built-in). Installable + offline app shell (NFR-1).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hissati — funding-readiness navigator",
    short_name: "Hissati",
    description:
      "Match UAE founders to real funding programs and turn every \"no\" into a cited next step.",
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

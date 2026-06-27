import { ImageResponse } from "next/og";
import { BrandMark } from "@/components/BrandMark";

export const alt = "Hissati — verified UAE funding, eligibility, and cited next steps";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "78px 86px",
          color: "#21180f",
          background: "#f6f1e7",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 760 }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#14584a" }}>
            Hissati · حِصّتي
          </div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 64, fontWeight: 700, lineHeight: 1.08 }}>
            Find the UAE funding you can reach.
          </div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 28, lineHeight: 1.4, color: "#5c5043" }}>
            Verified programs · clear eligibility · cited next steps
          </div>
        </div>
        <div
          style={{
            width: 250,
            height: 250,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 125,
            background: "#fbf8f1",
            boxShadow: "0 18px 50px rgba(33, 24, 15, 0.14)",
          }}
        >
          <BrandMark style={{ width: 210, height: 210, color: "#14584a" }} />
        </div>
      </div>
    ),
    size
  );
}

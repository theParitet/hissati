import { ImageResponse } from "next/og";
import { BrandMark } from "@/components/BrandMark";

export function brandIcon(size: { width: number; height: number }) {
  const inset = Math.round(size.width * 0.09);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fbf8f1",
        }}
      >
        <BrandMark
          style={{
            width: size.width - inset * 2,
            height: size.height - inset * 2,
            color: "#14584a",
          }}
        />
      </div>
    ),
    size
  );
}

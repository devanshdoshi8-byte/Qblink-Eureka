import { ReactNode } from "react";
import { theme } from "../theme";

interface Props {
  children: ReactNode;
  width?: number;
  style?: React.CSSProperties;
}

export const Phone: React.FC<Props> = ({ children, width = 380, style }) => {
  const height = width * 2.05;
  return (
    <div
      style={{
        width,
        height,
        borderRadius: width * 0.13,
        background: "linear-gradient(180deg, #1a2436 0%, #0b1220 100%)",
        padding: 14,
        boxShadow:
          "0 50px 120px -30px rgba(10,30,80,0.45), 0 20px 50px -10px rgba(11,26,51,0.25), inset 0 0 0 1px rgba(255,255,255,0.06)",
        position: "relative",
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: width * 0.1,
          background: theme.bg,
          overflow: "hidden",
          position: "relative",
          fontFamily: theme.font,
        }}
      >
        {/* Notch */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            width: width * 0.32,
            height: 24,
            background: "#0b1220",
            borderRadius: 16,
            zIndex: 10,
          }}
        />
        {/* Status bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 26px",
            fontSize: 13,
            fontWeight: 700,
            color: theme.text,
            zIndex: 5,
          }}
        >
          <span>9:41</span>
          <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ width: 16, height: 10, border: `1.5px solid ${theme.text}`, borderRadius: 2, position: "relative" }}>
              <span style={{ position: "absolute", inset: 1.5, background: theme.text, borderRadius: 1, width: "80%" }} />
            </span>
          </span>
        </div>
        <div style={{ paddingTop: 44, height: "100%", boxSizing: "border-box" }}>{children}</div>
      </div>
    </div>
  );
};
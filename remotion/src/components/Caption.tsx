import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";

interface Props {
  text: string;
  sub?: string;
  delay?: number;
  inFrames?: number;
  duration: number;
  position?: "bottom" | "top";
}

export const Caption: React.FC<Props> = ({ text, sub, delay = 8, duration, position = "bottom" }) => {
  const frame = useCurrentFrame();
  const f = frame - delay;
  const enter = interpolate(f, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exit = interpolate(frame, [duration - 18, duration], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const o = Math.min(enter, exit);
  const y = interpolate(enter, [0, 1], [24, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        [position]: 72,
        display: "flex",
        justifyContent: "center",
        opacity: o,
        transform: `translateY(${y}px)`,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "rgba(11, 26, 51, 0.92)",
          color: "#fff",
          padding: "16px 32px",
          borderRadius: 999,
          fontFamily: theme.font,
          fontWeight: 600,
          fontSize: 28,
          letterSpacing: -0.3,
          boxShadow: "0 20px 60px -20px rgba(0,0,0,0.4)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span>{text}</span>
        {sub && <span style={{ fontSize: 18, opacity: 0.7, fontWeight: 500 }}>{sub}</span>}
      </div>
    </div>
  );
};
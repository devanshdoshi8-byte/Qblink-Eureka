import { useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

export const BackgroundGrid: React.FC<{ tint?: string }> = ({ tint }) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const ty = (frame * 0.4) % 48;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: tint || `radial-gradient(ellipse at 30% 0%, ${theme.primaryGlow}22 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, ${theme.primary}18 0%, transparent 50%), linear-gradient(180deg, ${theme.bg} 0%, ${theme.bgDeep} 100%)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -48,
          backgroundImage:
            "linear-gradient(rgba(10,132,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(10,132,255,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          transform: `translateY(${ty}px)`,
          maskImage: `radial-gradient(ellipse at 50% 50%, black 30%, transparent 75%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -200,
          right: -200,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.primaryGlow}55 0%, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -300,
          left: -150,
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.primary}33 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 0%, ${theme.bgDeep}aa 100%)` }} />
    </div>
  );
};
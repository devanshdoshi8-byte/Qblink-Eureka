import { theme } from "../theme";

export const Logo: React.FC<{ size?: number; color?: string }> = ({ size = 32, color = theme.primary }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.28,
      background: `linear-gradient(135deg, ${theme.primaryGlow} 0%, ${color} 60%, ${theme.primaryDeep} 100%)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      fontWeight: 800,
      fontSize: size * 0.5,
      letterSpacing: -0.5,
      boxShadow: `0 6px 20px -4px ${color}66`,
      fontFamily: theme.font,
    }}
  >
    Q
  </div>
);
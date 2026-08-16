import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
  from: { x: number; y: number };
  to: { x: number; y: number };
  startFrame: number;
  endFrame: number;
  tapAt?: number;
}

export const Cursor: React.FC<Props> = ({ from, to, startFrame, endFrame, tapAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = interpolate(frame, [startFrame, endFrame], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // ease
  const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const x = interpolate(eased, [0, 1], [from.x, to.x]);
  const y = interpolate(eased, [0, 1], [from.y, to.y]);

  const tap = tapAt ?? endFrame;
  const tapScale = spring({ frame: frame - tap, fps, config: { damping: 12, stiffness: 220 } });
  const ringO = interpolate(frame - tap, [0, 24], [0.9, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ringS = interpolate(frame - tap, [0, 24], [0.4, 1.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  if (frame < startFrame - 4) return null;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: 44,
          height: 44,
          marginLeft: -22,
          marginTop: -22,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 75%)",
          boxShadow: "0 4px 16px rgba(11,26,51,0.4), 0 0 0 1.5px rgba(11,26,51,0.15)",
          transform: `scale(${1 - tapScale * 0.2})`,
          zIndex: 100,
          pointerEvents: "none",
        }}
      />
      {frame >= tap && (
        <div
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: 80,
            height: 80,
            marginLeft: -40,
            marginTop: -40,
            borderRadius: "50%",
            border: "2px solid rgba(10,132,255,0.8)",
            transform: `scale(${ringS})`,
            opacity: ringO,
            zIndex: 99,
            pointerEvents: "none",
          }}
        />
      )}
    </>
  );
};
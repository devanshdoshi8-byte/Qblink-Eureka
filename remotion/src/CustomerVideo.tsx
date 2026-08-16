import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Caption } from "./components/Caption";
import { BackgroundGrid } from "./components/BackgroundGrid";
import { Phone } from "./components/Phone";
import { Cursor } from "./components/Cursor";
import { Logo } from "./components/Logo";
import { theme } from "./theme";

// ----- Scene 1: The Problem ----------------------------------------
const SceneProblem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#dde4ee", opacity: fadeIn, fontFamily: theme.font }}>
      {/* Desaturated waiting room illustration */}
      <AbsoluteFill style={{ filter: "saturate(0.45)" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #d4dbe7 0%, #b7c1d4 100%)" }} />
        {/* Floor */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 280, background: "linear-gradient(180deg, #aab5c7 0%, #8693a8 100%)" }} />
        {/* Reception counter */}
        <div style={{ position: "absolute", bottom: 220, left: "55%", width: 540, height: 160, background: "#5d6a82", borderRadius: 12, boxShadow: "0 -10px 30px rgba(0,0,0,0.2)" }}>
          <div style={{ position: "absolute", top: -50, left: 40, color: "#fff", fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>RECEPTION</div>
        </div>
        {/* Queue of frustrated people (abstract figures) */}
        {Array.from({ length: 8 }).map((_, i) => {
          const sway = Math.sin((frame + i * 14) / 30) * 4;
          return (
            <div key={i} style={{ position: "absolute", bottom: 230 + (i % 2) * 6, left: 120 + i * 110, transform: `translateY(${sway}px)` }}>
              <div style={{ width: 70, height: 70, borderRadius: "50%", background: `hsl(${210 + i * 8}, 12%, ${42 + (i % 3) * 6}%)`, marginBottom: -8 }} />
              <div style={{ width: 90, height: 140, marginLeft: -10, borderRadius: "40px 40px 8px 8px", background: `hsl(${200 + i * 7}, 18%, ${38 + (i % 3) * 5}%)` }} />
            </div>
          );
        })}
        {/* Floating frustration marks */}
        {[0, 1, 2].map(i => {
          const f = (frame + i * 30) % 90;
          const o = interpolate(f, [0, 30, 90], [0, 0.55, 0]);
          const y = interpolate(f, [0, 90], [0, -50]);
          return (
            <div key={i} style={{ position: "absolute", bottom: 410 + i * 10, left: 180 + i * 280, opacity: o, transform: `translateY(${y}px)`, fontSize: 60, fontWeight: 800, color: "#7a3a3a" }}>
              !
            </div>
          );
        })}
      </AbsoluteFill>
      {/* Vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(11,26,51,0.55) 100%)" }} />
      <Caption text="Traditional waiting wastes time and creates chaos." delay={10} duration={130} />
    </AbsoluteFill>
  );
};

// ----- Scene 2: QR scan --------------------------------------------
const SceneQR: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneIn = spring({ frame: frame - 4, fps, config: { damping: 16, stiffness: 110 } });
  const phoneScale = interpolate(phoneIn, [0, 1], [0.7, 1]);
  const phoneY = interpolate(phoneIn, [0, 1], [60, 0]);
  const scanLine = ((frame * 6) % 280) - 20;
  const screenSwap = frame > 60;
  const swapO = interpolate(frame, [60, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ fontFamily: theme.font }}>
      <BackgroundGrid />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 100 }}>
        {/* QR poster on wall */}
        <div style={{ width: 320, height: 420, background: "#fff", borderRadius: 24, boxShadow: "0 30px 80px -20px rgba(11,26,51,0.25)", padding: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo size={28} />
            <span style={{ fontWeight: 800, fontSize: 20, color: theme.text, letterSpacing: -0.3 }}>Qblink</span>
          </div>
          <div style={{ position: "relative", width: 240, height: 240, background: "#fff", borderRadius: 12, padding: 12, border: `1px solid ${theme.border}` }}>
            {/* fake QR */}
            <svg viewBox="0 0 21 21" width="100%" height="100%" shapeRendering="crispEdges">
              {Array.from({ length: 21 }).map((_, y) =>
                Array.from({ length: 21 }).map((_, x) => {
                  // corner finders
                  const inCorner = (cx: number, cy: number) => x >= cx && x < cx + 7 && y >= cy && y < cy + 7;
                  const inInner = (cx: number, cy: number) => x >= cx + 2 && x < cx + 5 && y >= cy + 2 && y < cy + 5;
                  const ringEdge = (cx: number, cy: number) =>
                    inCorner(cx, cy) && !(x > cx && x < cx + 6 && y > cy && y < cy + 6);
                  const fill =
                    ringEdge(0, 0) || ringEdge(14, 0) || ringEdge(0, 14) ||
                    inInner(0, 0) || inInner(14, 0) || inInner(0, 14) ||
                    ((x + y * 3 + x * y) % 5 < 2 && !(x < 7 && y < 7) && !(x > 13 && y < 7) && !(x < 7 && y > 13));
                  return fill ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={theme.text} /> : null;
                })
              )}
            </svg>
            <div
              style={{
                position: "absolute",
                left: 12,
                right: 12,
                top: 12 + scanLine,
                height: 3,
                background: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)`,
                boxShadow: `0 0 18px 4px ${theme.primary}aa`,
                borderRadius: 2,
              }}
            />
          </div>
          <div style={{ fontSize: 16, color: theme.muted, fontWeight: 600 }}>Scan to join the queue</div>
        </div>

        {/* Phone */}
        <div style={{ transform: `translateY(${phoneY}px) scale(${phoneScale})` }}>
          <Phone width={340}>
            <div style={{ height: "100%", position: "relative" }}>
              {/* Camera viewfinder */}
              <div style={{ position: "absolute", inset: 0, opacity: 1 - swapO, background: "#0b1220" }}>
                <div style={{ position: "absolute", top: 60, left: 0, right: 0, textAlign: "center", color: "#fff", fontWeight: 600, fontSize: 14, opacity: 0.8 }}>Scanning…</div>
                <div style={{ position: "absolute", top: "30%", left: "12%", right: "12%", bottom: "30%", border: `2px solid ${theme.primaryGlow}`, borderRadius: 20, boxShadow: `inset 0 0 40px ${theme.primary}66` }} />
              </div>
              {/* Qblink interface */}
              <div style={{ position: "absolute", inset: 0, opacity: swapO, padding: "20px 22px", background: theme.bg }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                  <Logo size={28} />
                  <span style={{ fontWeight: 800, fontSize: 18, color: theme.text }}>Qblink</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: 22, color: theme.text, letterSpacing: -0.4 }}>City Health Clinic</div>
                <div style={{ fontSize: 13, color: theme.muted, marginTop: 4 }}>● Live · 14 waiting</div>
                <div style={{ marginTop: 24, padding: 18, background: theme.card, borderRadius: 18, boxShadow: "0 10px 30px -16px rgba(11,26,51,0.18)" }}>
                  <div style={{ fontSize: 12, color: theme.muted, fontWeight: 600 }}>Join the queue</div>
                  <div style={{ height: 12 }} />
                  <div style={{ height: 38, background: theme.bg, borderRadius: 10 }} />
                  <div style={{ height: 10 }} />
                  <div style={{ height: 38, background: theme.bg, borderRadius: 10 }} />
                </div>
              </div>
            </div>
          </Phone>
        </div>
      </div>
      <Caption text="Scan a QR or open a link. No app to download." duration={150} />
    </AbsoluteFill>
  );
};

// ----- Scene 3: Remote join -----------------------------------------
const SceneJoin: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // typing animation
  const name = "Sara Khan";
  const phone = "+91 98765 43210";
  const nameLen = Math.min(name.length, Math.max(0, Math.floor((frame - 12) / 2)));
  const phoneLen = Math.min(phone.length, Math.max(0, Math.floor((frame - 36) / 1.8)));
  const ticketIn = spring({ frame: frame - 100, fps, config: { damping: 14, stiffness: 130 } });
  const ticketY = interpolate(ticketIn, [0, 1], [120, 0]);
  const ticketO = interpolate(ticketIn, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ fontFamily: theme.font }}>
      <BackgroundGrid />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Phone width={400}>
          <div style={{ padding: "20px 24px", height: "100%", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Logo size={30} />
              <span style={{ fontWeight: 800, fontSize: 20, color: theme.text }}>Qblink</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: 22, color: theme.text }}>Join the Queue</div>
            <div style={{ fontSize: 13, color: theme.muted, marginTop: 4, marginBottom: 22 }}>City Health Clinic · ● 14 waiting</div>

            <div style={{ fontSize: 12, color: theme.muted, fontWeight: 600, marginBottom: 6 }}>FULL NAME</div>
            <div style={{ height: 48, background: theme.card, borderRadius: 12, border: `1px solid ${theme.border}`, padding: "0 14px", display: "flex", alignItems: "center", fontSize: 16, color: theme.text, fontWeight: 600 }}>
              {name.slice(0, nameLen)}<span style={{ width: 2, height: 18, background: theme.primary, marginLeft: 2, opacity: frame % 24 < 12 ? 1 : 0 }} />
            </div>
            <div style={{ height: 14 }} />
            <div style={{ fontSize: 12, color: theme.muted, fontWeight: 600, marginBottom: 6 }}>PHONE NUMBER</div>
            <div style={{ height: 48, background: theme.card, borderRadius: 12, border: `1px solid ${nameLen >= name.length ? theme.primary : theme.border}`, padding: "0 14px", display: "flex", alignItems: "center", fontSize: 16, color: theme.text, fontWeight: 600 }}>
              {phone.slice(0, phoneLen)}{nameLen >= name.length && phoneLen < phone.length && <span style={{ width: 2, height: 18, background: theme.primary, marginLeft: 2, opacity: frame % 24 < 12 ? 1 : 0 }} />}
            </div>

            <div style={{ height: 28 }} />
            <div
              style={{
                height: 56,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${theme.primaryGlow}, ${theme.primary} 60%, ${theme.primaryDeep})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: 17,
                letterSpacing: -0.2,
                boxShadow: `0 16px 32px -10px ${theme.primary}55`,
                transform: frame > 88 && frame < 100 ? "scale(0.97)" : "scale(1)",
              }}
            >
              Join Queue
            </div>

            {/* Token overlay */}
            <div
              style={{
                position: "absolute",
                left: 24,
                right: 24,
                bottom: 24,
                transform: `translateY(${ticketY}px)`,
                opacity: ticketO,
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDeep})`,
                color: "#fff",
                borderRadius: 22,
                padding: 22,
                boxShadow: `0 30px 60px -20px ${theme.primary}66`,
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 600, letterSpacing: 1 }}>YOUR TOKEN</div>
              <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>#15</div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 8 }}>Position 14 in queue · ~28 min</div>
            </div>
          </div>
        </Phone>
      </div>
      <Cursor from={{ x: 1320, y: 720 }} to={{ x: 960, y: 850 }} startFrame={70} endFrame={94} tapAt={94} />
      <Caption text="Join the queue remotely in seconds." duration={170} />
    </AbsoluteFill>
  );
};

// ----- Scene 4: Live tracking ---------------------------------------
const SceneTracking: React.FC = () => {
  const frame = useCurrentFrame();
  // queue ticks
  const stages = [
    { pos: 14, t: 0 },
    { pos: 10, t: 30 },
    { pos: 6, t: 60 },
    { pos: 3, t: 95 },
  ];
  let current = 14;
  for (const s of stages) if (frame >= s.t) current = s.pos;
  const progress = interpolate(current, [1, 14], [0.92, 0.1]);
  const eta = Math.max(2, current * 2);
  // pulse on number change
  const lastChangeFrame = [...stages].reverse().find(s => frame >= s.t)?.t ?? 0;
  const pulse = interpolate(frame - lastChangeFrame, [0, 14], [1.15, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ fontFamily: theme.font }}>
      <BackgroundGrid />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 80 }}>
        <Phone width={400}>
          <div style={{ padding: "20px 22px", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Logo size={30} />
              <span style={{ fontWeight: 800, fontSize: 20, color: theme.text }}>Qblink</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: theme.accent, fontWeight: 700, background: `${theme.accent}1f`, padding: "4px 10px", borderRadius: 20 }}>● LIVE</span>
            </div>
            <div style={{ fontSize: 12, color: theme.muted, fontWeight: 600, letterSpacing: 1 }}>YOUR POSITION</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4, transform: `scale(${pulse})`, transformOrigin: "left center" }}>
              <span style={{ fontSize: 90, fontWeight: 800, color: theme.text, letterSpacing: -3, lineHeight: 0.9 }}>#{current}</span>
              <span style={{ fontSize: 16, color: theme.muted, fontWeight: 600 }}>of 18</span>
            </div>
            <div style={{ marginTop: 18, height: 10, background: theme.bgDeep, borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress * 100}%`, background: `linear-gradient(90deg, ${theme.primaryGlow}, ${theme.primary})`, borderRadius: 999, transition: "none" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: theme.muted, fontWeight: 600 }}>
              <span>Token #15</span>
              <span>Est. {eta} min</span>
            </div>

            <div style={{ marginTop: 22, padding: 16, background: theme.card, borderRadius: 16, border: `1px solid ${theme.border}` }}>
              <div style={{ fontSize: 12, color: theme.muted, fontWeight: 700, letterSpacing: 0.8, marginBottom: 10 }}>NOW SERVING</div>
              {[current - 2, current - 1, current].filter(n => n > 0).map((n, i) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i === 0 ? "none" : `1px solid ${theme.border}` }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: i === 2 ? `${theme.primary}1a` : theme.bg, color: i === 2 ? theme.primary : theme.muted, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>#{n + 14 - current + 12}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: theme.text, fontSize: 14 }}>{["Dr. Reyes", "Dr. Patel", "Dr. Mehta"][i]}</div>
                    <div style={{ fontSize: 12, color: theme.muted }}>{i === 2 ? "In progress" : "Done"}</div>
                  </div>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: i === 2 ? theme.accent : theme.border }} />
                </div>
              ))}
            </div>
          </div>
        </Phone>

        {/* Floating UI annotations */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, width: 320 }}>
          {[
            { label: "Position", value: `#${current}`, hint: "updated live" },
            { label: "Wait time", value: `${eta} min`, hint: "estimated" },
            { label: "Status", value: "Live tracking", hint: "synced 1s ago" },
          ].map((c, i) => {
            const o = interpolate(frame, [10 + i * 8, 28 + i * 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const tx = interpolate(o, [0, 1], [40, 0]);
            return (
              <div key={c.label} style={{ opacity: o, transform: `translateX(${tx}px)`, background: theme.card, padding: 18, borderRadius: 18, border: `1px solid ${theme.border}`, boxShadow: "0 20px 50px -25px rgba(11,26,51,0.18)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: theme.muted, letterSpacing: 0.8 }}>{c.label.toUpperCase()}</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: theme.text, letterSpacing: -0.8, marginTop: 4 }}>{c.value}</div>
                <div style={{ fontSize: 12, color: theme.accent, fontWeight: 600, marginTop: 6 }}>● {c.hint}</div>
              </div>
            );
          })}
        </div>
      </div>
      <Caption text="Track your live position and waiting time." duration={150} />
    </AbsoluteFill>
  );
};

// ----- Scene 5: Customer freedom ------------------------------------
const SceneFreedom: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scenes = ["Cafe", "Outdoors", "In the car", "Working remotely"];
  const dur = 28;
  const idx = Math.min(scenes.length - 1, Math.floor(frame / dur));
  const localF = frame - idx * dur;
  const sceneO = interpolate(localF, [0, 8, dur - 8, dur], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  const phoneFloat = Math.sin(frame / 14) * 6;
  // small position update visible on phone
  const pos = idx <= 1 ? 6 : idx === 2 ? 3 : 1;

  const palettes = [
    ["#f1d6b5", "#c89172"], // cafe warm
    ["#cfe2c5", "#7ea787"], // outdoors green
    ["#c2cfe0", "#5b6c85"], // car
    ["#e6d2f0", "#9c7cb8"], // remote work
  ][idx] as [string, string];

  return (
    <AbsoluteFill style={{ fontFamily: theme.font, background: theme.bg }}>
      {/* Big environment swatch */}
      <AbsoluteFill style={{ background: `linear-gradient(135deg, ${palettes[0]} 0%, ${palettes[1]} 100%)`, opacity: sceneO * 0.95 }}>
        <div style={{ position: "absolute", top: 80, left: 100, fontSize: 22, fontWeight: 800, color: "rgba(11,26,51,0.65)", letterSpacing: -0.5, textTransform: "uppercase" }}>
          <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.7 }}>SCENE</div>
          <div style={{ fontSize: 64 }}>{scenes[idx]}</div>
        </div>
        {/* abstract environment shapes */}
        <div style={{ position: "absolute", bottom: -150, right: -100, width: 600, height: 600, borderRadius: "50%", background: "rgba(255,255,255,0.25)" }} />
        <div style={{ position: "absolute", top: -80, right: 200, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.18)" }} />
      </AbsoluteFill>

      {/* Phone with live update overlay */}
      <div style={{ position: "absolute", left: "55%", top: "50%", transform: `translate(-50%, -50%) translateY(${phoneFloat}px) rotate(-4deg)` }}>
        <Phone width={320}>
          <div style={{ padding: 20, height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Logo size={24} />
              <span style={{ fontWeight: 800, fontSize: 15, color: theme.text }}>Qblink</span>
              <span style={{ marginLeft: "auto", fontSize: 10, color: theme.accent, fontWeight: 700, background: `${theme.accent}1f`, padding: "3px 8px", borderRadius: 20 }}>● LIVE</span>
            </div>
            <div style={{ fontSize: 11, color: theme.muted, fontWeight: 700, letterSpacing: 0.8 }}>POSITION</div>
            <div style={{ fontSize: 72, fontWeight: 800, color: theme.text, letterSpacing: -3, lineHeight: 1 }}>#{pos}</div>
            <div style={{ marginTop: 10, height: 8, background: theme.bgDeep, borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(15 - pos) / 15 * 100}%`, background: theme.primary, borderRadius: 999 }} />
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: theme.muted, fontWeight: 600 }}>Est. {pos * 2} min · synced live</div>

            <div style={{ marginTop: 16, padding: 12, background: theme.card, borderRadius: 14, border: `1px solid ${theme.border}` }}>
              <div style={{ fontSize: 10, color: theme.muted, fontWeight: 700, letterSpacing: 0.8, marginBottom: 6 }}>RECENT UPDATE</div>
              <div style={{ fontSize: 12, color: theme.text, fontWeight: 600 }}>Now serving #{14 - pos}</div>
            </div>
          </div>
        </Phone>
      </div>
      <Caption text="No need to physically wait." sub="Live in your pocket, anywhere." duration={130} />
    </AbsoluteFill>
  );
};

// ----- Scene 6: Turn notification ----------------------------------
const SceneNotify: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const notifIn = spring({ frame: frame - 14, fps, config: { damping: 16, stiffness: 130 } });
  const notifY = interpolate(notifIn, [0, 1], [-220, 40]);
  const notifO = interpolate(notifIn, [0, 0.4], [0, 1]);
  const ringS = interpolate((frame - 14) % 30, [0, 30], [0.6, 2.2], { extrapolateLeft: "clamp" });
  const ringO = interpolate((frame - 14) % 30, [0, 30], [0.5, 0]);

  return (
    <AbsoluteFill style={{ fontFamily: theme.font }}>
      <BackgroundGrid />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Phone width={400}>
          <div style={{ padding: "20px 22px", height: "100%", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Logo size={30} />
              <span style={{ fontWeight: 800, fontSize: 20, color: theme.text }}>Qblink</span>
            </div>
            <div style={{ fontSize: 12, color: theme.muted, fontWeight: 700, letterSpacing: 0.8 }}>YOUR TURN</div>
            <div style={{ fontSize: 90, fontWeight: 800, color: theme.primary, letterSpacing: -3, lineHeight: 0.95 }}>#1</div>
            <div style={{ fontSize: 16, color: theme.text, fontWeight: 700, marginTop: 4 }}>You're up next</div>
            <div style={{ marginTop: 16, padding: 16, background: `${theme.primary}10`, borderRadius: 16, border: `1px solid ${theme.primary}33` }}>
              <div style={{ fontSize: 14, color: theme.primaryDeep, fontWeight: 700 }}>Please head to Counter 2</div>
              <div style={{ fontSize: 12, color: theme.muted, marginTop: 4 }}>City Health Clinic · 2nd floor</div>
            </div>

            {/* pulsing ring around notification icon */}
            <div style={{ position: "absolute", left: "50%", bottom: 90, marginLeft: -32 }}>
              <div style={{ position: "absolute", width: 64, height: 64, borderRadius: "50%", border: `2px solid ${theme.primary}`, transform: `scale(${ringS})`, opacity: ringO, left: 0, top: 0 }} />
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDeep})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 20px 40px -10px ${theme.primary}66` }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zM18 16v-5a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2z" fill="#fff" />
                </svg>
              </div>
            </div>
          </div>
        </Phone>
      </div>

      {/* iOS-style banner notification */}
      <div style={{ position: "absolute", top: 0, left: "50%", transform: `translateX(-50%) translateY(${notifY}px)`, opacity: notifO, width: 560, padding: "16px 20px", background: "rgba(20, 28, 45, 0.94)", borderRadius: 22, display: "flex", alignItems: "center", gap: 14, color: "#fff", boxShadow: "0 30px 60px -20px rgba(0,0,0,0.4)" }}>
        <Logo size={40} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>Qblink · now</div>
          <div style={{ fontWeight: 700, fontSize: 17, marginTop: 2 }}>Your turn is approaching</div>
          <div style={{ fontSize: 14, opacity: 0.8, marginTop: 2 }}>Please head to City Health Clinic — Counter 2</div>
        </div>
      </div>

      <Caption text="Get notified when your turn is near." duration={130} />
    </AbsoluteFill>
  );
};

// ----- Scene 7: Ending ----------------------------------------------
const SceneEnd: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoIn = spring({ frame, fps, config: { damping: 14, stiffness: 130 } });
  const textO = interpolate(frame, [20, 36], [0, 1], { extrapolateRight: "clamp" });
  const subO = interpolate(frame, [40, 56], [0, 1], { extrapolateRight: "clamp" });
  const ctaIn = spring({ frame: frame - 70, fps, config: { damping: 14, stiffness: 130 } });
  return (
    <AbsoluteFill style={{ fontFamily: theme.font }}>
      <BackgroundGrid tint={`linear-gradient(135deg, ${theme.bg} 0%, ${theme.primary}22 100%)`} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22 }}>
        <div style={{ transform: `scale(${logoIn})` }}>
          <Logo size={120} />
        </div>
        <div style={{ opacity: textO, fontWeight: 800, fontSize: 86, color: theme.text, letterSpacing: -2.2, textAlign: "center" }}>
          Qblink
        </div>
        <div style={{ opacity: subO, fontWeight: 600, fontSize: 32, color: theme.muted, letterSpacing: -0.4 }}>
          Smarter Walk-In Flow
        </div>
        <div style={{ marginTop: 24, transform: `scale(${ctaIn})`, opacity: ctaIn }}>
          <div style={{ padding: "20px 38px", borderRadius: 999, background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDeep})`, color: "#fff", fontWeight: 700, fontSize: 22, letterSpacing: -0.3, boxShadow: `0 24px 60px -16px ${theme.primary}77` }}>
            Join the future of customer flow →
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ----- Main composition ---------------------------------------------
const SCENES: Array<{ comp: React.FC; dur: number }> = [
  { comp: SceneProblem, dur: 130 },
  { comp: SceneQR, dur: 110 },
  { comp: SceneJoin, dur: 130 },
  { comp: SceneTracking, dur: 130 },
  { comp: SceneFreedom, dur: 130 }, // 28*4 = 112 plus padding
  { comp: SceneNotify, dur: 110 },
  { comp: SceneEnd, dur: 120 },
];

export const CustomerVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: theme.bg, fontFamily: theme.font }}>
      <TransitionSeries>
        {SCENES.map((s, i) => (
          <>
            <TransitionSeries.Sequence key={`s-${i}`} durationInFrames={s.dur}>
              <s.comp />
            </TransitionSeries.Sequence>
            {i < SCENES.length - 1 && (
              <TransitionSeries.Transition
                key={`t-${i}`}
                presentation={fade()}
                timing={linearTiming({ durationInFrames: 14 })}
              />
            )}
          </>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
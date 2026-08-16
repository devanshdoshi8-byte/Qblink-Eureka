import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Caption } from "./components/Caption";
import { BackgroundGrid } from "./components/BackgroundGrid";
import { Logo } from "./components/Logo";
import { Cursor } from "./components/Cursor";
import { theme } from "./theme";

// Sidebar nav for dashboard
const DashSidebar: React.FC<{ active?: number }> = ({ active = 0 }) => (
  <div style={{ width: 220, background: theme.card, borderRight: `1px solid ${theme.border}`, padding: 22, display: "flex", flexDirection: "column", gap: 6 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
      <Logo size={32} />
      <span style={{ fontWeight: 800, fontSize: 17, color: theme.text }}>Qblink</span>
    </div>
    {["Queue Manager", "Analytics", "Tokens", "Settings"].map((label, i) => (
      <div
        key={label}
        style={{
          padding: "10px 14px",
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 600,
          color: i === active ? "#fff" : theme.muted,
          background: i === active ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDeep})` : "transparent",
        }}
      >
        {label}
      </div>
    ))}
  </div>
);

// ----- Scene 1: Business chaos -------------------------------------
const SceneChaos: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#dde4ee", opacity: fadeIn, fontFamily: theme.font }}>
      <AbsoluteFill style={{ filter: "saturate(0.5)" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #c8d2e0 0%, #97a2b6 100%)" }} />
        {/* Long reception counter */}
        <div style={{ position: "absolute", bottom: 250, left: 0, right: 0, height: 180, background: "linear-gradient(180deg, #6c7a92 0%, #4d5a72 100%)" }}>
          <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", color: "#fff", fontSize: 34, fontWeight: 800, letterSpacing: -0.6 }}>RECEPTION DESK</div>
        </div>
        {/* Crowd */}
        {Array.from({ length: 14 }).map((_, i) => {
          const wave = Math.sin((frame + i * 9) / 20) * 4;
          return (
            <div key={i} style={{ position: "absolute", bottom: 260 + (i % 3) * 6, left: 80 + i * 120 + (i % 2) * 20, transform: `translateY(${wave}px)` }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: `hsl(${200 + i * 6}, 12%, ${38 + (i % 4) * 6}%)`, marginBottom: -8 }} />
              <div style={{ width: 80, height: 120, marginLeft: -10, borderRadius: "36px 36px 8px 8px", background: `hsl(${190 + i * 4}, 16%, ${32 + (i % 4) * 5}%)` }} />
            </div>
          );
        })}
        {/* Paper tokens floating */}
        {[0, 1, 2, 3].map(i => {
          const f = (frame + i * 25) % 100;
          const o = interpolate(f, [0, 30, 100], [0, 0.6, 0]);
          const y = interpolate(f, [0, 100], [0, -80]);
          return (
            <div key={i} style={{ position: "absolute", top: 240 + i * 30, left: 380 + i * 220, opacity: o, transform: `translateY(${y}px) rotate(${(i - 2) * 8}deg)`, width: 80, height: 50, background: "#f6efdf", borderRadius: 4, fontSize: 18, fontWeight: 800, color: "#7a5a2a", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 14px rgba(0,0,0,0.2)" }}>
              #{14 + i * 3}
            </div>
          );
        })}
        {[0, 1, 2].map(i => {
          const f = (frame + i * 30) % 90;
          const o = interpolate(f, [0, 30, 90], [0, 0.55, 0]);
          return (
            <div key={i} style={{ position: "absolute", bottom: 420, left: 300 + i * 320, opacity: o, fontSize: 50, fontWeight: 800, color: "#7a3a3a" }}>?</div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(11,26,51,0.55) 100%)" }} />
      <Caption text="Walk-ins quickly become chaos at rush hour." duration={130} />
    </AbsoluteFill>
  );
};

// ----- Scene 2: Dashboard intro ------------------------------------
const SceneDashIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dashIn = spring({ frame: frame - 4, fps, config: { damping: 18, stiffness: 90 } });
  const dashS = interpolate(dashIn, [0, 1], [1.08, 1]);
  const dashO = interpolate(dashIn, [0, 1], [0, 1]);

  const queueGrowth = (i: number) => {
    const start = 30 + i * 6;
    return interpolate(frame, [start, start + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  };

  return (
    <AbsoluteFill style={{ fontFamily: theme.font }}>
      <BackgroundGrid />
      <div style={{ position: "absolute", inset: "5% 6%", borderRadius: 24, overflow: "hidden", boxShadow: "0 60px 120px -40px rgba(11,26,51,0.35), 0 20px 50px -10px rgba(11,26,51,0.15)", background: theme.card, transform: `scale(${dashS})`, opacity: dashO, display: "flex", border: `1px solid ${theme.border}` }}>
        <DashSidebar active={0} />
        <div style={{ flex: 1, padding: 32, background: theme.bg, position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 28, color: theme.text, letterSpacing: -0.6 }}>Queue Manager</div>
              <div style={{ fontSize: 13, color: theme.muted, marginTop: 2 }}>City Health Clinic · Live</div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ padding: "10px 16px", background: theme.card, borderRadius: 12, border: `1px solid ${theme.border}`, fontSize: 13, fontWeight: 600, color: theme.text }}>+ Add Walk-in</div>
              <div style={{ padding: "10px 16px", background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDeep})`, color: "#fff", borderRadius: 12, fontSize: 13, fontWeight: 700 }}>Call next →</div>
            </div>
          </div>
          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
            {[
              { label: "Waiting", value: 14, hint: "+3 vs hr ago", color: theme.primary },
              { label: "Avg wait", value: "18m", hint: "stable", color: theme.accent },
              { label: "Served today", value: 96, hint: "+12%", color: theme.primaryDeep },
              { label: "No-shows", value: "2.1%", hint: "−0.4%", color: theme.warn },
            ].map((c, i) => {
              const o = queueGrowth(i);
              return (
                <div key={c.label} style={{ background: theme.card, padding: 16, borderRadius: 16, border: `1px solid ${theme.border}`, opacity: o, transform: `translateY(${interpolate(o, [0, 1], [14, 0])}px)` }}>
                  <div style={{ fontSize: 11, color: theme.muted, fontWeight: 700, letterSpacing: 0.8 }}>{c.label.toUpperCase()}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: theme.text, letterSpacing: -1, marginTop: 4 }}>{c.value}</div>
                  <div style={{ fontSize: 12, color: c.color, fontWeight: 700, marginTop: 4 }}>● {c.hint}</div>
                </div>
              );
            })}
          </div>
          {/* Queue list preview */}
          <div style={{ background: theme.card, borderRadius: 16, border: `1px solid ${theme.border}`, padding: 18, opacity: interpolate(frame, [54, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: theme.text }}>Live queue</div>
              <div style={{ fontSize: 11, color: theme.accent, fontWeight: 700 }}>● syncing</div>
            </div>
            {[
              { n: 12, name: "Aarav Sharma", st: "In progress", c: theme.accent },
              { n: 13, name: "Priya Singh", st: "Up next", c: theme.primary },
              { n: 14, name: "Rohan Mehta", st: "Waiting", c: theme.muted },
              { n: 15, name: "Sara Khan", st: "Waiting", c: theme.muted },
              { n: 16, name: "Kabir Iyer", st: "Waiting", c: theme.muted },
            ].map((r, i) => (
              <div key={r.n} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderTop: i === 0 ? "none" : `1px solid ${theme.border}` }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${r.c}1a`, color: r.c, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>#{r.n}</div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: theme.text }}>{r.name}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: r.c }}>{r.st}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Caption text="One lightweight dashboard runs the entire queue." duration={150} />
    </AbsoluteFill>
  );
};

// ----- Scene 3: Live management with cursor -------------------------
const SceneLiveMgmt: React.FC = () => {
  const frame = useCurrentFrame();
  // Calling next at frame 50 -> queue shifts. Add walk-in at frame 100.
  const calledNext = frame > 50;
  const newWalkIn = frame > 110;
  const baseQueue = [
    { n: 12, name: "Aarav Sharma", st: "In progress" },
    { n: 13, name: "Priya Singh", st: "Up next" },
    { n: 14, name: "Rohan Mehta", st: "Waiting" },
    { n: 15, name: "Sara Khan", st: "Waiting" },
    { n: 16, name: "Kabir Iyer", st: "Waiting" },
  ];
  const afterCall = [
    { n: 13, name: "Priya Singh", st: "In progress" },
    { n: 14, name: "Rohan Mehta", st: "Up next" },
    { n: 15, name: "Sara Khan", st: "Waiting" },
    { n: 16, name: "Kabir Iyer", st: "Waiting" },
  ];
  const afterWalkIn = [...afterCall, { n: 17, name: "Meera Joshi", st: "Waiting" }];
  const list = newWalkIn ? afterWalkIn : calledNext ? afterCall : baseQueue;

  // Counter values animating
  const waiting = list.filter(r => r.st !== "In progress").length;
  const served = calledNext ? 97 : 96;

  return (
    <AbsoluteFill style={{ fontFamily: theme.font }}>
      <BackgroundGrid />
      <div style={{ position: "absolute", inset: "5% 6%", borderRadius: 24, overflow: "hidden", boxShadow: "0 60px 120px -40px rgba(11,26,51,0.35)", background: theme.card, display: "flex", border: `1px solid ${theme.border}` }}>
        <DashSidebar active={0} />
        <div style={{ flex: 1, padding: 32, background: theme.bg, position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 26, color: theme.text, letterSpacing: -0.5 }}>Queue Manager</div>
              <div style={{ fontSize: 13, color: theme.muted }}>City Health Clinic · ● Live</div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ padding: "10px 16px", background: theme.card, borderRadius: 12, border: `1px solid ${newWalkIn ? theme.primary : theme.border}`, fontSize: 13, fontWeight: 700, color: newWalkIn ? theme.primary : theme.text, transform: frame > 100 && frame < 112 ? "scale(0.97)" : "scale(1)" }}>+ Add walk-in</div>
              <div style={{ padding: "10px 16px", background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDeep})`, color: "#fff", borderRadius: 12, fontSize: 13, fontWeight: 700, transform: frame > 44 && frame < 56 ? "scale(0.97)" : "scale(1)", boxShadow: frame > 40 && frame < 70 ? `0 0 0 4px ${theme.primary}33` : "none" }}>Call next →</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 18 }}>
            {[
              { label: "Waiting now", value: waiting },
              { label: "Served today", value: served },
              { label: "Avg wait", value: "17m" },
            ].map(c => (
              <div key={c.label} style={{ background: theme.card, padding: 16, borderRadius: 16, border: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: 11, color: theme.muted, fontWeight: 700, letterSpacing: 0.8 }}>{c.label.toUpperCase()}</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: theme.text, letterSpacing: -1, marginTop: 4 }}>{c.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: theme.card, borderRadius: 16, border: `1px solid ${theme.border}`, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: theme.text }}>Live queue</div>
              <div style={{ fontSize: 11, color: theme.accent, fontWeight: 700 }}>● syncing realtime</div>
            </div>
            {list.map((r, i) => {
              const isNew = r.n === 17;
              const newIn = isNew ? interpolate(frame, [112, 130], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
              const newY = isNew ? interpolate(newIn, [0, 1], [-12, 0]) : 0;
              const c = r.st === "In progress" ? theme.accent : r.st === "Up next" ? theme.primary : theme.muted;
              return (
                <div key={r.n} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 0", borderTop: i === 0 ? "none" : `1px solid ${theme.border}`, opacity: newIn, transform: `translateY(${newY}px)`, background: isNew && frame < 140 ? `${theme.primary}10` : "transparent", borderRadius: isNew ? 10 : 0, paddingLeft: isNew ? 10 : 0, paddingRight: isNew ? 10 : 0 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${c}1a`, color: c, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>#{r.n}</div>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: theme.text }}>{r.name}{isNew && <span style={{ marginLeft: 8, fontSize: 10, color: theme.primary, fontWeight: 800, letterSpacing: 0.6 }}>NEW</span>}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: c }}>{r.st}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Cursor from={{ x: 1500, y: 320 }} to={{ x: 1620, y: 178 }} startFrame={20} endFrame={48} tapAt={48} />
      <Cursor from={{ x: 1620, y: 178 }} to={{ x: 1440, y: 178 }} startFrame={80} endFrame={108} tapAt={108} />
      <Caption text="Call the next visitor or add a walk-in instantly." duration={170} />
    </AbsoluteFill>
  );
};

// ----- Scene 4: Before/After ----------------------------------------
const SceneBeforeAfter: React.FC = () => {
  const frame = useCurrentFrame();
  const dividerX = interpolate(frame, [10, 40], [50, 50], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ fontFamily: theme.font, background: theme.bg }}>
      <BackgroundGrid />
      {/* Two halves */}
      <div style={{ position: "absolute", inset: 0, display: "flex" }}>
        <div style={{ flex: 1, position: "relative", padding: 60, display: "flex", flexDirection: "column", justifyContent: "center", filter: "saturate(0.7)" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: theme.red, letterSpacing: 1.4, marginBottom: 10 }}>BEFORE</div>
          <div style={{ fontSize: 48, fontWeight: 800, color: theme.text, letterSpacing: -1.2, lineHeight: 1.05, marginBottom: 18 }}>Constant<br />interruptions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {["“What's my number?”", "“How long now?”", "“Is it my turn yet?”"].map((q, i) => {
              const o = interpolate(frame, [10 + i * 14, 28 + i * 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return (
                <div key={q} style={{ opacity: o, padding: "14px 18px", background: "#fff", border: `1px solid ${theme.border}`, borderRadius: 14, fontSize: 18, color: theme.text, fontWeight: 600, maxWidth: 480, boxShadow: "0 10px 30px -16px rgba(11,26,51,0.18)" }}>{q}</div>
              );
            })}
          </div>
        </div>
        <div style={{ flex: 1, position: "relative", padding: 60, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: theme.accent, letterSpacing: 1.4, marginBottom: 10 }}>AFTER QBLINK</div>
          <div style={{ fontSize: 48, fontWeight: 800, color: theme.text, letterSpacing: -1.2, lineHeight: 1.05, marginBottom: 18 }}>Calm,<br />in control</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { k: "Interruptions", v: "−72%", c: theme.accent },
              { k: "Avg wait", v: "−34%", c: theme.primary },
              { k: "Customer satisfaction", v: "+41%", c: theme.primaryDeep },
            ].map((s, i) => {
              const o = interpolate(frame, [30 + i * 14, 48 + i * 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const tx = interpolate(o, [0, 1], [30, 0]);
              return (
                <div key={s.k} style={{ opacity: o, transform: `translateX(${tx}px)`, padding: "16px 20px", background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, boxShadow: "0 10px 30px -16px rgba(11,26,51,0.18)", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 480 }}>
                  <div style={{ fontSize: 16, color: theme.muted, fontWeight: 600 }}>{s.k}</div>
                  <div style={{ fontSize: 26, color: s.c, fontWeight: 800, letterSpacing: -0.6 }}>{s.v}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Divider */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${dividerX}%`, width: 2, background: `linear-gradient(180deg, transparent, ${theme.primary}aa, transparent)`, boxShadow: `0 0 24px ${theme.primary}66` }} />
      <Caption text="Fewer front-desk interruptions. Better flow." duration={140} />
    </AbsoluteFill>
  );
};

// ----- Scene 5: Insights / analytics --------------------------------
const SceneInsights: React.FC = () => {
  const frame = useCurrentFrame();
  const bars = [0.3, 0.45, 0.7, 1.0, 0.85, 0.6, 0.4, 0.55, 0.95, 0.75, 0.5, 0.3];
  return (
    <AbsoluteFill style={{ fontFamily: theme.font }}>
      <BackgroundGrid />
      <div style={{ position: "absolute", inset: "5% 6%", borderRadius: 24, overflow: "hidden", boxShadow: "0 60px 120px -40px rgba(11,26,51,0.35)", background: theme.card, display: "flex", border: `1px solid ${theme.border}` }}>
        <DashSidebar active={1} />
        <div style={{ flex: 1, padding: 32, background: theme.bg }}>
          <div style={{ fontWeight: 800, fontSize: 26, color: theme.text, letterSpacing: -0.5 }}>Analytics</div>
          <div style={{ fontSize: 13, color: theme.muted, marginBottom: 22 }}>Last 7 days</div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>
            {/* Bar chart */}
            <div style={{ background: theme.card, padding: 24, borderRadius: 18, border: `1px solid ${theme.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, color: theme.muted, fontWeight: 700, letterSpacing: 0.6 }}>WALK-INS PER HOUR</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: theme.text, letterSpacing: -1 }}>1,247</div>
                </div>
                <div style={{ fontSize: 13, color: theme.accent, fontWeight: 700, background: `${theme.accent}1a`, padding: "6px 12px", borderRadius: 20 }}>+18% vs last wk</div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 220 }}>
                {bars.map((b, i) => {
                  const grow = interpolate(frame, [10 + i * 3, 30 + i * 3], [0, b], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                  const isPeak = b === 1;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ width: "100%", height: `${grow * 100}%`, borderRadius: 8, background: isPeak ? `linear-gradient(180deg, ${theme.primaryGlow}, ${theme.primary})` : `${theme.primary}55` }} />
                      <div style={{ fontSize: 10, color: theme.muted, fontWeight: 600 }}>{9 + i}h</div>
                    </div>
                  );
                })}
              </div>
              {/* Peak label */}
              <div style={{ marginTop: 8, fontSize: 12, color: theme.primary, fontWeight: 700, opacity: interpolate(frame, [70, 90], [0, 1], { extrapolateRight: "clamp" }) }}>
                ▲ Peak hour detected: 12:00 — 13:00
              </div>
            </div>

            {/* Donut + stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: theme.card, padding: 18, borderRadius: 16, border: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: 11, color: theme.muted, fontWeight: 700, letterSpacing: 0.8 }}>AVG WAIT TIME</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: theme.text, letterSpacing: -1, marginTop: 2 }}>17m 22s</div>
                <div style={{ fontSize: 12, color: theme.accent, fontWeight: 700, marginTop: 4 }}>● −34% vs last month</div>
              </div>
              <div style={{ background: theme.card, padding: 18, borderRadius: 16, border: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: 11, color: theme.muted, fontWeight: 700, letterSpacing: 0.8 }}>CHANNEL MIX</div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
                  {(() => {
                    const total = 360;
                    const a = interpolate(frame, [20, 50], [0, total * 0.62], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                    return (
                      <svg width={92} height={92} viewBox="0 0 100 100">
                        <circle cx={50} cy={50} r={40} stroke={`${theme.primary}22`} strokeWidth={14} fill="none" />
                        <circle cx={50} cy={50} r={40} stroke={theme.primary} strokeWidth={14} fill="none" strokeDasharray={`${a} 360`} strokeLinecap="round" transform="rotate(-90 50 50)" pathLength={360} />
                      </svg>
                    );
                  })()}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: theme.text }}><span style={{ width: 10, height: 10, borderRadius: 4, background: theme.primary }} />Digital · 62%</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: theme.muted }}><span style={{ width: 10, height: 10, borderRadius: 4, background: theme.border }} />Walk-in · 38%</div>
                  </div>
                </div>
              </div>
              <div style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDeep})`, padding: 18, borderRadius: 16, color: "#fff" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, opacity: 0.85 }}>INSIGHT</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4, lineHeight: 1.35 }}>Add one more staff between 12–1pm to cut wait by ~22%.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Caption text="Understand rush patterns and optimize operations." duration={150} />
    </AbsoluteFill>
  );
};

// ----- Scene 6: Industries ------------------------------------------
const SceneIndustries: React.FC = () => {
  const frame = useCurrentFrame();
  const items = [
    { name: "Clinics", icon: "🩺" },
    { name: "Diagnostics", icon: "🧪" },
    { name: "Salons", icon: "💈" },
    { name: "Restaurants", icon: "🍽" },
    { name: "Service centers", icon: "🛠" },
    { name: "Pharmacies", icon: "💊" },
  ];
  return (
    <AbsoluteFill style={{ fontFamily: theme.font }}>
      <BackgroundGrid />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 16, color: theme.primary, fontWeight: 800, letterSpacing: 2 }}>BUILT FOR HIGH-FOOTFALL</div>
          <div style={{ fontSize: 64, fontWeight: 800, color: theme.text, letterSpacing: -1.6, marginTop: 6 }}>Any walk-in business.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 280px)", gridTemplateRows: "repeat(2, 140px)", gap: 18 }}>
          {items.map((it, i) => {
            const s = spring({ frame: frame - (10 + i * 6), fps: 30, config: { damping: 16, stiffness: 130 } });
            return (
              <div key={it.name} style={{ transform: `scale(${s}) translateY(${interpolate(s, [0, 1], [22, 0])}px)`, opacity: s, background: theme.card, borderRadius: 22, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, border: `1px solid ${theme.border}`, boxShadow: "0 20px 40px -20px rgba(11,26,51,0.18)" }}>
                <div style={{ width: 60, height: 60, borderRadius: 16, background: `${theme.primary}14`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>{it.icon}</div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: theme.text, letterSpacing: -0.4 }}>{it.name}</div>
                  <div style={{ fontSize: 12, color: theme.accent, fontWeight: 700, marginTop: 2 }}>● Live with Qblink</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Caption text="One operating layer. Every high walk-in environment." duration={130} />
    </AbsoluteFill>
  );
};

// ----- Scene 7: No hardware -----------------------------------------
const SceneNoHardware: React.FC = () => {
  const frame = useCurrentFrame();
  const machineO = interpolate(frame, [10, 70], [1, 0]);
  const machineY = interpolate(frame, [10, 70], [0, 60]);
  const machineBlur = interpolate(frame, [10, 70], [0, 6]);
  const browserIn = spring({ frame: frame - 50, fps: 30, config: { damping: 16, stiffness: 110 } });
  return (
    <AbsoluteFill style={{ fontFamily: theme.font }}>
      <BackgroundGrid />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 80 }}>
        {/* old token machine */}
        <div style={{ opacity: machineO, transform: `translateY(${machineY}px)`, filter: `blur(${machineBlur}px) saturate(0.7)` }}>
          <div style={{ width: 220, height: 360, background: "linear-gradient(180deg, #b3becf 0%, #6c7a92 100%)", borderRadius: 24, padding: 18, boxShadow: "0 30px 60px -20px rgba(11,26,51,0.4)", position: "relative" }}>
            <div style={{ width: "100%", height: 110, background: "#1a2436", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#ff6f3c", fontFamily: "monospace", fontSize: 56, fontWeight: 800, letterSpacing: 4 }}>A−47</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14 }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{ aspectRatio: "1", background: "#3e4a60", borderRadius: 6 }} />
              ))}
            </div>
            <div style={{ position: "absolute", bottom: 18, left: 18, right: 18, height: 30, background: "#1a2436", borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, textAlign: "center", marginTop: 14, letterSpacing: 1 }}>BULKY HARDWARE</div>
        </div>

        {/* arrow */}
        <div style={{ fontSize: 60, color: theme.primary, opacity: interpolate(frame, [30, 60], [0, 1], { extrapolateRight: "clamp" }) }}>→</div>

        {/* browser mock */}
        <div style={{ transform: `scale(${browserIn})`, opacity: browserIn }}>
          <div style={{ width: 520, height: 360, background: theme.card, borderRadius: 18, border: `1px solid ${theme.border}`, boxShadow: "0 40px 100px -30px rgba(11,26,51,0.3)", overflow: "hidden" }}>
            <div style={{ height: 36, background: theme.bg, display: "flex", alignItems: "center", padding: "0 14px", gap: 6, borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff6058" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c941" }} />
              <div style={{ flex: 1, marginLeft: 14, fontSize: 11, color: theme.muted, background: "#fff", padding: "5px 12px", borderRadius: 8, border: `1px solid ${theme.border}`, fontWeight: 600 }}>qblink.app/dashboard</div>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <Logo size={28} />
                <div style={{ fontWeight: 800, fontSize: 17, color: theme.text }}>Qblink</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {["14", "96", "17m"].map((v, i) => (
                  <div key={i} style={{ padding: 14, background: theme.bg, borderRadius: 12, border: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: 9, color: theme.muted, fontWeight: 700, letterSpacing: 0.6 }}>{["WAITING", "SERVED", "AVG WAIT"][i]}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: theme.text, letterSpacing: -0.6, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, height: 140, background: theme.bg, borderRadius: 12, border: `1px solid ${theme.border}`, padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                {[12, 13, 14, 15].map((n, i) => (
                  <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px" }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: i === 0 ? `${theme.accent}22` : `${theme.primary}1a`, color: i === 0 ? theme.accent : theme.primary, fontWeight: 800, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>#{n}</div>
                    <div style={{ flex: 1, height: 8, background: theme.border, borderRadius: 4 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.primary, textAlign: "center", marginTop: 14, letterSpacing: 1 }}>JUST A BROWSER</div>
        </div>
      </div>
      <Caption text="No expensive hardware. No complex setup." duration={130} />
    </AbsoluteFill>
  );
};

// ----- Scene 8: Ending ----------------------------------------------
const SceneEnd: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoIn = spring({ frame, fps, config: { damping: 14, stiffness: 130 } });
  const titleO = interpolate(frame, [20, 36], [0, 1], { extrapolateRight: "clamp" });
  const subO = interpolate(frame, [40, 56], [0, 1], { extrapolateRight: "clamp" });
  const ctaIn = spring({ frame: frame - 70, fps, config: { damping: 14, stiffness: 130 } });
  return (
    <AbsoluteFill style={{ fontFamily: theme.font }}>
      <BackgroundGrid tint={`linear-gradient(135deg, ${theme.bg} 0%, ${theme.primary}22 100%)`} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22 }}>
        <div style={{ transform: `scale(${logoIn})` }}>
          <Logo size={120} />
        </div>
        <div style={{ opacity: titleO, fontWeight: 800, fontSize: 78, color: theme.text, letterSpacing: -2, textAlign: "center", maxWidth: 1200 }}>
          The operating layer for<br />walk-in businesses.
        </div>
        <div style={{ opacity: subO, fontWeight: 600, fontSize: 26, color: theme.muted, letterSpacing: -0.4 }}>
          Qblink — Smarter walk-in flow
        </div>
        <div style={{ marginTop: 24, transform: `scale(${ctaIn})`, opacity: ctaIn }}>
          <div style={{ padding: "20px 38px", borderRadius: 999, background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDeep})`, color: "#fff", fontWeight: 700, fontSize: 22, letterSpacing: -0.3, boxShadow: `0 24px 60px -16px ${theme.primary}77` }}>
            Book a demo →
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ----- Compose ------------------------------------------------------
const SCENES: Array<{ comp: React.FC; dur: number }> = [
  { comp: SceneChaos, dur: 130 },
  { comp: SceneDashIntro, dur: 130 },
  { comp: SceneLiveMgmt, dur: 170 },
  { comp: SceneBeforeAfter, dur: 140 },
  { comp: SceneInsights, dur: 150 },
  { comp: SceneIndustries, dur: 130 },
  { comp: SceneNoHardware, dur: 130 },
  { comp: SceneEnd, dur: 120 },
];

export const BusinessVideo: React.FC = () => {
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
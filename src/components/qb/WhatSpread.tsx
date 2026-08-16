export const WhatSpread = () => (
  <section
    className="relative cream-surface py-24 sm:py-32 overflow-hidden"
    aria-label="What Qblink is"
  >
    <div className="max-w-7xl mx-auto px-6 lg:px-24 grid lg:grid-cols-12 gap-16 items-start">
      {/* Left illustration column */}
      <div className="lg:col-span-5 relative">
        <div className="font-mono-caps text-ink/50 mb-6">Ch. 03 · The object</div>

        {/* Isometric phone — hand drawn feel */}
        <svg viewBox="0 0 320 480" className="w-full max-w-xs">
          <defs>
            <pattern id="dots" width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.6" fill="hsl(var(--ink) / 0.35)" />
            </pattern>
          </defs>
          {/* shadow */}
          <ellipse cx="180" cy="450" rx="120" ry="10" fill="hsl(var(--ink) / 0.1)" />
          {/* phone body */}
          <g transform="translate(60,40) skewY(-6)">
            <rect x="0" y="0" width="200" height="380" rx="18" fill="hsl(var(--ink))" />
            <rect x="10" y="10" width="180" height="360" rx="10" fill="hsl(var(--deep))" />
            {/* screen contents */}
            <rect x="24" y="30" width="80" height="8" rx="2" fill="hsl(var(--glow))" opacity="0.8" />
            <rect x="24" y="46" width="140" height="4" rx="2" fill="hsl(var(--cream) / 0.5)" />

            {/* live position badge */}
            <g transform="translate(24,80)">
              <rect width="152" height="86" rx="6" fill="hsl(var(--cream))" />
              <text x="12" y="24" fontFamily="Space Grotesk" fontSize="9" fill="hsl(var(--ink) / 0.6)" letterSpacing="1.5">
                POSITION
              </text>
              <text x="12" y="66" fontFamily="Space Grotesk" fontSize="42" fill="hsl(var(--ink))" fontWeight="600">
                3
              </text>
              <text x="70" y="66" fontFamily="Space Grotesk" fontSize="14" fill="hsl(var(--ink) / 0.5)">
                / 8 min
              </text>
              <circle cx="140" cy="20" r="4" fill="hsl(var(--teal))" >
                <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite"/>
              </circle>
            </g>

            {/* moving dots list */}
            {[0,1,2,3].map((i) => (
              <g key={i} transform={`translate(24, ${190 + i * 34})`}>
                <circle cx="6" cy="6" r="4" fill={i===0 ? "hsl(var(--glow))" : "hsl(var(--cream) / 0.3)"} />
                <rect x="18" y="2" width={120 - i*18} height="4" rx="2" fill="hsl(var(--cream) / 0.35)" />
                <rect x="18" y="10" width={80 - i*10} height="3" rx="2" fill="hsl(var(--cream) / 0.2)" />
              </g>
            ))}

            <rect x="24" y="340" width="152" height="14" rx="3" fill="hsl(var(--glow))" />
          </g>
          {/* dotted rays behind phone */}
          <rect x="0" y="0" width="60" height="480" fill="url(#dots)" opacity="0.6" />
        </svg>

        {/* handwritten annotation */}
        <div className="absolute -right-4 top-32 font-display italic text-ink/70 rotate-[-6deg] max-w-[140px] leading-tight">
          ← live position updates as the queue moves
        </div>
      </div>

      {/* Right editorial */}
      <div className="lg:col-span-7 lg:pt-16">
        <h2 className="font-display text-5xl sm:text-6xl text-ink leading-[0.95]">
          A queue that lives on the internet — not on your counter.
        </h2>
        <div className="rule-thin my-10" />
        <p className="text-ink/70 text-lg leading-relaxed max-w-xl">
          Qblink is the invisible layer between a walk-in business and the
          people waiting for it. Customers scan a QR code, take a spot, and
          get on with their day. Staff see a single dashboard that fuses
          walk-ins and remote joiners into one honest flow.
        </p>
        <p className="text-ink/60 leading-relaxed max-w-xl mt-6">
          No app to download. No hardware to buy. No training to sit through.
          Just a link — the same way your customers already use the internet.
        </p>

        <div className="mt-10 grid grid-cols-3 gap-6 max-w-lg">
          <Fact k="< 2 min" v="from signup to first ticket" />
          <Fact k="0" v="hardware required" />
          <Fact k="1 link" v="replaces the whole queue" />
        </div>
      </div>
    </div>
  </section>
);

const Fact = ({ k, v }: { k: string; v: string }) => (
  <div>
    <div className="font-display text-3xl text-ink">{k}</div>
    <div className="font-mono-caps text-ink/50 mt-1 leading-snug">{v}</div>
  </div>
);
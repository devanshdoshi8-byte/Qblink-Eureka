import { useId, useState, type KeyboardEvent } from "react";
import { motion, type Variants } from "framer-motion";

// Each stat row fades up gently. Slow duration + soft ease keeps the reveal
// subtle; children are absolutely predictable in size so no layout shift.
const statVariants: Variants = {
  open: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  closed: { opacity: 0, y: 4, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};
// Responsive variants (generated at build time). WebP for modern browsers,
// JPG fallback at 800w. Small (480), medium (800), large (1200) widths.
import clinic480 from "@/assets/env-clinic-480.webp";
import clinic800 from "@/assets/env-clinic-800.webp";
import clinic1200 from "@/assets/env-clinic-1200.webp";
import clinic800Jpg from "@/assets/env-clinic-800.jpg";
import salon480 from "@/assets/env-salon-480.webp";
import salon800 from "@/assets/env-salon-800.webp";
import salon1200 from "@/assets/env-salon-1200.webp";
import salon800Jpg from "@/assets/env-salon-800.jpg";
import cafe480 from "@/assets/env-cafe-480.webp";
import cafe800 from "@/assets/env-cafe-800.webp";
import cafe1200 from "@/assets/env-cafe-1200.webp";
import cafe800Jpg from "@/assets/env-cafe-800.jpg";
import gov480 from "@/assets/env-gov-480.webp";
import gov800 from "@/assets/env-gov-800.webp";
import gov1200 from "@/assets/env-gov-1200.webp";
import gov800Jpg from "@/assets/env-gov-800.jpg";
import service480 from "@/assets/env-service-480.webp";
import service800 from "@/assets/env-service-800.webp";
import service1200 from "@/assets/env-service-1200.webp";
import service800Jpg from "@/assets/env-service-800.jpg";
import pharmacy480 from "@/assets/env-pharmacy-480.webp";
import pharmacy800 from "@/assets/env-pharmacy-800.webp";
import pharmacy1200 from "@/assets/env-pharmacy-1200.webp";
import pharmacy800Jpg from "@/assets/env-pharmacy-800.jpg";

type ImgSet = {
  webp: { w480: string; w800: string; w1200: string };
  jpg: string;
  w: number;
  h: number;
};

const IMG = {
  clinic:   { webp: { w480: clinic480,   w800: clinic800,   w1200: clinic1200   }, jpg: clinic800Jpg,   w: 1280, h: 1600 },
  salon:    { webp: { w480: salon480,    w800: salon800,    w1200: salon1200    }, jpg: salon800Jpg,    w: 1280, h: 1280 },
  cafe:     { webp: { w480: cafe480,     w800: cafe800,     w1200: cafe1200     }, jpg: cafe800Jpg,     w: 1280, h: 960  },
  gov:      { webp: { w480: gov480,      w800: gov800,      w1200: gov1200      }, jpg: gov800Jpg,      w: 1280, h: 960  },
  service:  { webp: { w480: service480,  w800: service800,  w1200: service1200  }, jpg: service800Jpg,  w: 1280, h: 960  },
  pharmacy: { webp: { w480: pharmacy480, w800: pharmacy800, w1200: pharmacy1200 }, jpg: pharmacy800Jpg, w: 1280, h: 960  },
} satisfies Record<string, ImgSet>;

type Env = {
  chapter: string;
  name: string;
  detail: string;
  wait: string;
  pain: string;
  fix: string;
  img: ImgSet;
  className: string;
  offset?: string;
};

const envs: Env[] = [
  {
    chapter: "01",
    name: "Clinics",
    detail: "Sensitive waits, thin privacy, no one enjoys sitting there.",
    wait: "34 min avg wait",
    pain: "Anxious patients repeatedly ask the front desk 'how long more?'",
    fix: "Qblink lets patients wait from anywhere and see their live position.",
    img: IMG.clinic,
    className: "md:col-span-7 md:row-span-2 aspect-[4/5] md:aspect-auto md:min-h-[560px]",
  },
  {
    chapter: "02",
    name: "Salons & spas",
    detail: "Peak-hour crush where appointments collide with walk-ins.",
    wait: "42 min avg wait",
    pain: "Stylists lose time explaining the queue instead of styling.",
    fix: "One shared queue view keeps walk-ins predictable without disrupting bookings.",
    img: IMG.salon,
    className: "md:col-span-5 aspect-[4/3]",
    offset: "md:mt-12",
  },
  {
    chapter: "03",
    name: "Cafés & bakeries",
    detail: "Order queues that stall behind hesitation at the counter.",
    wait: "11 min avg wait",
    pain: "Peak-hour lines push new customers back onto the street.",
    fix: "Digital pickup tokens keep the counter clear and the queue moving.",
    img: IMG.cafe,
    className: "md:col-span-5 aspect-[4/3]",
  },
  {
    chapter: "04",
    name: "Government offices",
    detail: "Where waiting quietly became a national sport.",
    wait: "1 hr 20 min avg wait",
    pain: "Paper tokens, shouted numbers, and no way to know your turn.",
    fix: "A live queue on any phone replaces the paper stub and the shouting.",
    img: IMG.gov,
    className: "md:col-span-4 aspect-[3/4] md:aspect-[4/5]",
    offset: "md:-mt-8",
  },
  {
    chapter: "05",
    name: "Service centres",
    detail: "Documents, tokens, three counters — controlled chaos.",
    wait: "38 min avg wait",
    pain: "Customers wander between counters without knowing where to stand.",
    fix: "Qblink routes each token to the right counter with clear next-up updates.",
    img: IMG.service,
    className: "md:col-span-4 aspect-[4/3]",
  },
  {
    chapter: "06",
    name: "Small pharmacies",
    detail: "Two-person counter, twelve-person line, no room to breathe.",
    wait: "9 min avg wait",
    pain: "Regulars leave when the aisle fills; footfall is lost silently.",
    fix: "Customers hold their place from outside and walk in when it's their turn.",
    img: IMG.pharmacy,
    className: "md:col-span-4 aspect-[4/3]",
    offset: "md:mt-10",
  },
];

const Tile = ({ e, i }: { e: Env; i: number }) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const headingId = useId();
  const handleKey = (ev: KeyboardEvent<HTMLElement>) => {
    if (ev.key === "Enter" || ev.key === " " || ev.key === "Spacebar") {
      ev.preventDefault();
      setOpen((v) => !v);
    } else if (ev.key === "Escape" && open) {
      ev.preventDefault();
      setOpen(false);
    }
  };
  return (
    <motion.article
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden rounded-sm cursor-pointer isolate
        border border-border-hairline
        shadow-[0_10px_40px_-20px_hsl(var(--ink)/0.25)]
        dark:shadow-[0_20px_60px_-25px_hsl(0_0%_0%/0.6)]
        hover:shadow-[0_24px_60px_-24px_hsl(var(--ink)/0.35)]
        dark:hover:shadow-[0_30px_80px_-25px_hsl(0_0%_0%/0.8)]
        transition-shadow duration-700
        focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-cream dark:focus-visible:ring-offset-ink
        ${e.className} ${e.offset ?? ""}`}
      onClick={() => setOpen((v) => !v)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onKeyDown={handleKey}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-controls={panelId}
      aria-labelledby={headingId}
    >
      {/* Painterly illustration — responsive, lazy, async-decoded */}
      <picture>
        <source
          type="image/webp"
          srcSet={`${e.img.webp.w480} 480w, ${e.img.webp.w800} 800w, ${e.img.webp.w1200} 1200w`}
          sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw"
        />
        <img
          src={e.img.jpg}
          width={e.img.w}
          height={e.img.h}
          alt=""
          loading="lazy"
          decoding="async"
          // @ts-expect-error fetchpriority is valid HTML but not yet in React types
          fetchpriority="low"
          className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-[1800ms] ease-out"
        />
      </picture>

      {/* Navy atmospheric overlay — deeper in dark */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/55 to-ink/20 dark:from-black/92 dark:via-black/70 dark:to-black/35" aria-hidden />

      {/* Paper grain + dot texture */}
      <div
        className="absolute inset-0 opacity-[0.12] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(hsl(var(--cream) / 0.6) 0.5px, transparent 0.5px)",
          backgroundSize: "6px 6px",
        }}
        aria-hidden
      />

      {/* Soft edge vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_120px_hsl(var(--ink)/0.5)] dark:shadow-[inset_0_0_140px_hsl(0_0%_0%/0.7)] pointer-events-none" aria-hidden />

      {/* Slow light sweep */}
      <div className="absolute -inset-x-1/2 -top-1/2 h-[200%] w-[200%] rotate-12 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
        <div
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cream/15 to-transparent animate-[sweep_5s_ease-in-out_infinite]"
        />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-5 sm:p-7 text-cream">
        <div className="flex items-center gap-3 font-mono-caps text-xs tracking-[0.2em] text-cream/60">
          <span>CH · {e.chapter}</span>
          <span className="h-px w-8 bg-cream/30" />
        </div>

        <div>
          <h3 id={headingId} className="font-display text-2xl sm:text-3xl md:text-4xl leading-[1.05]">
            {e.name}
          </h3>
          <p className="mt-2 text-sm sm:text-base text-cream/75 leading-snug max-w-[38ch]">
            {e.detail}
          </p>

          {/*
           * Mini case study reveal.
           * Always mounted so the tile reserves its space — no layout shift on
           * open/close. We animate only opacity + a small translateY, then
           * stagger the three stat rows in one after another with slow, subtle
           * easing. `pointer-events` are toggled so it doesn't intercept hover
           * when hidden.
           */}
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={headingId}
            aria-hidden={!open}
            initial={false}
            animate={open ? "open" : "closed"}
            variants={{
              open: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.9,
                  ease: [0.22, 1, 0.36, 1],
                  when: "beforeChildren",
                  staggerChildren: 0.14,
                  delayChildren: 0.12,
                },
              },
              closed: {
                opacity: 0,
                y: 6,
                transition: {
                  duration: 0.6,
                  ease: [0.4, 0, 0.2, 1],
                  when: "afterChildren",
                  staggerChildren: 0.05,
                  staggerDirection: -1,
                },
              },
            }}
            className="mt-5 pointer-events-none"
            style={{ pointerEvents: open ? "auto" : "none" }}
          >
            <div className="border-t border-cream/20 pt-4 space-y-3 text-sm">
              <motion.div
                variants={statVariants}
                className="flex items-baseline gap-2 font-mono-caps text-xs tracking-[0.18em] text-teal"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
                {e.wait}
              </motion.div>
              <motion.p variants={statVariants} className="text-cream/85 leading-relaxed">
                <span className="font-mono-caps text-xs tracking-[0.18em] text-cream/50 block mb-1">
                  The pain
                </span>
                {e.pain}
              </motion.p>
              <motion.p variants={statVariants} className="text-cream/85 leading-relaxed">
                <span className="font-mono-caps text-xs tracking-[0.18em] text-teal/80 block mb-1">
                  With Qblink
                </span>
                {e.fix}
              </motion.p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.article>
  );
};

export const Environments = () => (
  <section
    className="relative cream-surface py-24 sm:py-32 overflow-hidden"
    aria-label="Where waiting lives"
  >
    <style>{`
      @keyframes sweep {
        0% { transform: translateX(-120%); }
        60%, 100% { transform: translateX(320%); }
      }
    `}</style>

    <div className="max-w-7xl mx-auto px-6 lg:px-16">
      <div className="grid lg:grid-cols-12 gap-6 mb-16 items-end">
        <div className="lg:col-span-7">
          <div className="font-mono-caps text-ink/50 mb-4">Ch. 07 · Where the wait lives</div>
          <h2 className="font-display text-4xl sm:text-6xl text-ink leading-[0.95]">
            Every walk-in business has a version of the same line.
          </h2>
        </div>
        <p className="lg:col-span-4 text-ink/60 leading-relaxed">
          Qblink was shaped by the businesses least likely to buy a hardware
          ticket dispenser. If your queue is a whiteboard, a shouted name, or
          a folded paper — this is for you.
        </p>
      </div>

      {/* Editorial mosaic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-5 md:gap-6">
        {envs.map((e, i) => (
          <Tile key={e.name} e={e} i={i} />
        ))}
      </div>

      {/* Closing editorial statement */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="mt-24 sm:mt-32 text-center"
      >
        <div className="font-mono-caps text-ink/40 mb-6 tracking-[0.25em] text-xs">
          ONE INVISIBLE THREAD
        </div>
        <p className="font-display text-3xl sm:text-5xl text-ink leading-[1.1] max-w-3xl mx-auto">
          Different businesses.
          <br />
          <span className="text-ink/70">Different workflows.</span>
          <br />
          <span className="text-teal">The same invisible line.</span>
        </p>
      </motion.div>
    </div>
  </section>
);